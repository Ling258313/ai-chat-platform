import type { SpeechRecognitionCallbacks, SpeechRecognizerHandle } from "@/types";

/**
 * Web Speech API 封装
 * - SpeechRecognition:语音识别(STT)
 * - speechSynthesis:语音合成(TTS)
 */

// 类型声明(Web Speech API 部分接口在 TS 中尚不完整)
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        // 每个 result 既是备选结果的类数组(要能取 [0].transcript),
        // 自己又带 isFinal 标记 —— 用交叉类型把两层合起来。
        // 补全之后,下面就不用 (result as unknown as ...) 断言了。
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal?: boolean }
        >;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 检测浏览器是否支持语音识别 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/** 检测浏览器是否支持语音合成 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * 创建语音识别实例
 * 需要用户手势触发 start(),识别期间需保持页面焦点
 */
export function createSpeechRecognizer(
  callbacks: SpeechRecognitionCallbacks,
): SpeechRecognizerHandle | null {
  const Ctor = getSpeechRecognition();
  if (!Ctor) return null;

  const nativeRecognition = new Ctor();
  nativeRecognition.lang = "zh-CN";
  nativeRecognition.continuous = true;
  nativeRecognition.interimResults = true;
  nativeRecognition.maxAlternatives = 1;

  let finalText = "";
  // 内部状态:识别是否已启动(防止重复 start 抛异常)
  let started = false;

  nativeRecognition.onstart = () => {
    started = true;
    finalText = "";
    callbacks.onStart?.();
  };

  nativeRecognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const first = result?.[0];
      const transcript = first?.transcript ?? "";
      // 判断是否为最终结果
      const isFinal = result?.isFinal ?? false;
      if (isFinal) {
        finalText += transcript;
      } else {
        interim += transcript;
      }
    }
    const combined = (finalText + interim).trim();
    if (combined) {
      callbacks.onResult(combined);
    }
  };

  // 错误码 → 用户友好提示
  const ERROR_MESSAGES: Record<string, string> = {
    "not-allowed":
      "语音识别被拒绝,请允许浏览器使用麦克风(地址栏🔒点击后开启权限)",
    "service-not-allowed": "语音服务不可用,请检查浏览器权限或使用 HTTPS",
    network:
      "语音识别网络错误:Chrome 的语音识别依赖 Google 服务,国内网络可能无法访问。建议改用 Edge 浏览器试试",
    "audio-capture": "无法访问麦克风,请检查麦克风设备是否被其他程序占用",
    "language-not-supported": "当前浏览器不支持中文语音识别",
    aborted: "语音识别已中断",
    "no-speech": "", // 未检测到语音,静默忽略
  };

  nativeRecognition.onerror = (event) => {
    const message = ERROR_MESSAGES[event.error];
    // no-speech / 未知错误码:静默或兜底提示
    if (!message) {
      if (event.error !== "no-speech") {
        callbacks.onError?.(new Error(`语音识别错误:${event.error}`));
      }
      return;
    }
    callbacks.onError?.(new Error(message));
  };

  nativeRecognition.onend = () => {
    // 识别已结束(自然结束或被 stop/abort),重置状态
    started = false;
    callbacks.onEnd?.();
  };

  return {
    start: () => {
      // 防重入:已在识别中,忽略重复调用
      if (started) return;
      started = true;
      try {
        nativeRecognition.start();
      } catch {
        // start 抛错(如状态异常),复位并上报
        started = false;
        callbacks.onError?.(new Error("语音识别启动失败,请稍后重试"));
      }
    },
    stop: () => {
      started = false;
      nativeRecognition.stop();
    },
    abort: () => {
      started = false;
      nativeRecognition.abort();
    },
  };
}

/**
 * 语音合成:朗读文本
 * @param onEnd 朗读真正结束时回调(正常读完 / 出错 / 被 cancel 中断都会触发)。
 *   调用方靠它复位状态,而不是按字数估算时长 —— 语速、标点、语言都会影响实际耗时,估算必然不准。
 */
export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;

  // 先取消上一次朗读,避免叠加播放
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1;
  utterance.pitch = 1;
  // 两条路径都要回调:正常结束走 onend,cancel/出错走 onerror
  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }
  window.speechSynthesis.speak(utterance);
}

/** 停止语音合成 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
