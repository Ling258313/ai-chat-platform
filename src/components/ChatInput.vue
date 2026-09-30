<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { useChatStore } from "@/stores/chat";
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
} from "@/services/speech";
import type { SpeechRecognizerHandle } from "@/types";

const chatStore = useChatStore();
const inputRef = ref<HTMLTextAreaElement | null>(null);
const text = ref("");
const isListening = ref(false);
const isSupported = isSpeechRecognitionSupported();

//   它只有三个方法,内部自己管 started 状态,所以不用关心原生 start() 会抛异常
let recognizer: SpeechRecognizerHandle | null = null;

function handleInput() {
  // 自动调整高度
  const el = inputRef.value;
  if (el) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Enter 发送,Shift+Enter 换行
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    handleSend();
  }
}

async function handleSend() {
  const content = text.value.trim();
  if (!content || chatStore.isSending) return;

  // 停止语音识别
  if (isListening.value) {
    stopListening();
  }

  text.value = "";
  if (inputRef.value) {
    inputRef.value.style.height = "auto";
  }

  await chatStore.sendMessage(content);
  inputRef.value?.focus();
}

function startListening() {
  if (!isSupported) {
    alert("当前浏览器不支持语音识别,请使用 Chrome 或 Edge");
    return;
  }

  // 需要 HTTPS 或 localhost
  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    alert("语音识别需要 HTTPS 环境,请在 localhost 或 HTTPS 下使用");
    return;
  }

  if (!recognizer) {
    // 懒创建:识别器只需要一个,内部挂着四个回调,重复创建会让回调越挂越多
    //
    // 下面四个回调按「实际触发顺序」排列:
    //   onStart -> onResult(可能几十次) -> [onError] -> onEnd
    // 对象字面量的书写顺序不影响执行,但按顺序写读起来不用来回跳。
    recognizer = createSpeechRecognizer({
      // ① 识别引擎启动成功(点麦克风之后最先到)
      onStart: () => {
        isListening.value = true;
      },
      // ② 每识别出一段文字就回调一次,result 是「确认文本 + 中间文本」拼好的完整串
      onResult: (result) => {
        text.value = result;
        handleInput(); // 内容变了要重新算 textarea 高度
      },
      // ③ 出错(可选,不是每次都有)
      onError: (err) => {
        // 这里也复位一次:虽然出错后一般还会来 onEnd,
        // 但不能依赖「onError 之后一定会来 onEnd」这个假设。
        isListening.value = false;
        // network 类错误(国内 Chrome 无法访问 Google 服务)给出更醒目的提示
        const msg = err.message;
        if (
          msg.includes("network") ||
          msg.includes("网络错误") ||
          msg.includes("Google")
        ) {
          alert(
            "语音识别暂不可用:" +
              msg +
              "\n\n建议:改用 Edge 浏览器,或使用文本输入。",
          );
        } else {
          alert(msg);
        }
      },
      // ④ 收尾:自然结束 / stop() / abort() 三种情况都会走到这里
      onEnd: () => {
        isListening.value = false;
      },
    });
  }

  recognizer?.start();
}

function stopListening() {
  recognizer?.stop();
}

function toggleListening() {
  if (isListening.value) {
    stopListening();
  } else {
    startListening();
  }
}

onUnmounted(() => {
  if (isListening.value) {
    recognizer?.abort();
  }
});
</script>

<template>
  <div class="chat-input-wrap">
    <div class="chat-input">
      <button
        class="mic-btn"
        :class="{ listening: isListening }"
        :title="isListening ? '停止语音输入' : '语音输入'"
        :disabled="!isSupported"
        @click="toggleListening"
      >
        <span class="mic-icon">{{ isListening ? "⏹" : "🎤" }}</span>
        <span v-if="isListening" class="mic-pulse"></span>
      </button>

      <textarea
        ref="inputRef"
        v-model="text"
        class="input-area"
        placeholder="输入消息,Enter 发送,Shift+Enter 换行"
        rows="1"
        :disabled="chatStore.isSending"
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>

      <!-- 流式输出中:同一个位置变成"停止"按钮,让用户能中断 -->
      <button
        v-if="chatStore.isSending"
        class="send-btn stop"
        title="停止生成"
        @click="chatStore.stopGeneration()"
      >
        ⏹ 停止
      </button>
      <button
        v-else
        class="send-btn"
        :class="{ disabled: !text.trim() }"
        :disabled="!text.trim()"
        @click="handleSend"
      >
        发送
      </button>
    </div>

    <p v-if="!isSupported" class="tip">
      ⚠️ 当前浏览器不支持语音识别,请使用 Chrome / Edge / Safari
    </p>
    <p v-else class="tip">
      {{ isListening ? "🎤 正在聆听,请说话…" : "支持语音输入,点击 🎤 开始" }}
    </p>
  </div>
</template>

<style scoped>
.chat-input-wrap {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-sidebar);
}

.chat-input {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 8px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.chat-input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
}

.mic-btn {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--border-light);
  transition: all 0.2s;
}

.mic-btn:hover:not(:disabled) {
  background: var(--primary-bg);
}

.mic-btn.listening {
  background: var(--danger);
}

.mic-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mic-icon {
  position: relative;
  z-index: 1;
}

.mic-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--danger);
  animation: pulse 1.2s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.input-area {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  padding: 10px 4px;
  min-height: 40px;
  max-height: 160px;
  font-size: 14px;
  line-height: 1.5;
}

.send-btn {
  height: 40px;
  padding: 0 20px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.send-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 流式输出中的"停止"按钮:用危险色区分于发送 */
.send-btn.stop {
  background: var(--danger);
}

.send-btn.stop:hover:not(:disabled) {
  background: #dc2626;
}

.tip {
  max-width: 860px;
  margin: 8px auto 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}
</style>
