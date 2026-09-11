import { ref, onUnmounted } from 'vue'
import { speak, stopSpeaking, isSpeechSynthesisSupported } from '@/services/speech'

/**
 * 语音合成组合式函数
 * 用于在组件中朗读文本
 */
export function useSpeechSynthesis() {
  const isSpeaking = ref(false)
  const supported = isSpeechSynthesisSupported()

  function speakText(text: string) {
    if (!supported || !text.trim()) return
    isSpeaking.value = true
    // 用语音引擎真正的结束事件复位,而不是按字数估算:
    // 原先的 max(2000, 字数 × 300) 会让 200 字等 60 秒,
    // 期间按钮一直显示"停止",而实际早就读完了。
    speak(text, () => {
      isSpeaking.value = false
    })
  }

  function stop() {
    stopSpeaking()
    isSpeaking.value = false
  }

  onUnmounted(() => {
    stopSpeaking()
    isSpeaking.value = false
  })

  return { isSpeaking, supported, speakText, stop }
}
