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
    speak(text)
    isSpeaking.value = true
    // 估算朗读结束时间
    const estimateMs = Math.max(2000, text.length * 300)
    setTimeout(() => {
      isSpeaking.value = false
    }, estimateMs)
  }

  function stop() {
    stopSpeaking()
    isSpeaking.value = false
  }

  onUnmounted(() => {
    stopSpeaking()
  })

  return { isSpeaking, supported, speakText, stop }
}
