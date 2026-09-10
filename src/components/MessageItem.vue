<script setup lang="ts">
import type { Message } from '@/types'
import { useSpeechSynthesis } from '@/composables/useSpeech'
import { ref, watch } from 'vue'

const props = defineProps<{
  message: Message
}>()

const { isSpeaking, supported, speakText, stop } = useSpeechSynthesis()
const isCopied = ref(false)

// 自动朗读 AI 回复(如果开启了设置)
// 由父组件控制,这里只提供手动朗读
watch(
  () => props.message.content,
  (val) => {
    if (val) isCopied.value = false
  },
)

function handleSpeak() {
  if (isSpeaking.value) {
    stop()
  } else {
    speakText(props.message.content)
  }
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    isCopied.value = true
    setTimeout(() => (isCopied.value = false), 1500)
  } catch {
    // 忽略复制失败
  }
}
</script>

<template>
  <div class="message" :class="message.role">
    <div class="avatar">
      {{ message.role === 'user' ? '👤' : '🤖' }}
    </div>

    <div class="bubble-wrap">
      <div class="bubble" :class="{ error: message.error }">
        <!-- 打字机光标 -->
        <span v-if="message.content" class="content">{{ message.content }}</span>
        <span v-else-if="message.isStreaming" class="placeholder">思考中…</span>

        <!-- 流式动画 -->
        <span v-if="message.isStreaming && message.content" class="cursor">▍</span>

        <!-- 错误提示 -->
        <div v-if="message.error" class="error-msg">
          ⚠️ {{ message.error }}
        </div>
      </div>

      <div v-if="message.role === 'assistant' && message.content" class="actions">
        <button class="action-btn" title="复制" @click="handleCopy">
          {{ isCopied ? '✓ 已复制' : '📋 复制' }}
        </button>
        <button
          v-if="supported"
          class="action-btn"
          :title="isSpeaking ? '停止朗读' : '朗读'"
          @click="handleSpeak"
        >
          {{ isSpeaking ? '⏹ 停止' : '🔊 朗读' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  animation: fadeIn 0.25s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--border-light);
}

.message.user .avatar {
  background: var(--primary-bg);
}

.bubble-wrap {
  max-width: 78%;
  display: flex;
  flex-direction: column;
}

.message.user .bubble-wrap {
  align-items: flex-end;
}

.bubble {
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
}

.message.user .bubble {
  background: var(--bubble-user);
  color: var(--bubble-user-text);
  border-top-right-radius: 4px;
}

.message.assistant .bubble {
  background: var(--bubble-ai);
  color: var(--bubble-ai-text);
  border-top-left-radius: 4px;
}

.bubble.error {
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
}

.placeholder {
  color: var(--text-muted);
  font-style: italic;
}

.cursor {
  display: inline-block;
  animation: blink 0.8s infinite;
  color: var(--primary);
  margin-left: 2px;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.error-msg {
  margin-top: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
  border-radius: var(--radius-sm);
  font-size: 12px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.action-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--border-light);
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.action-btn:hover {
  color: var(--primary);
  background: var(--primary-bg);
}
</style>
