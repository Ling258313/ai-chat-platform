<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import MessageItem from '@/components/MessageItem.vue'

const chatStore = useChatStore()
const scrollRef = ref<HTMLElement | null>(null)

// 消息变化时滚动到底部
watch(
  () => chatStore.messages.map((m) => `${m.id}:${m.content.length}:${m.isStreaming}`).join('|'),
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { flush: 'post' },
)

// 切换会话时滚动到底部
watch(
  () => chatStore.activeConversationId,
  async () => {
    await nextTick()
    scrollToBottom()
  },
)

function scrollToBottom() {
  const el = scrollRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

defineExpose({ scrollToBottom })
</script>

<template>
  <div ref="scrollRef" class="chat-window">
    <!-- 空状态 -->
    <div v-if="chatStore.messages.length === 0" class="empty-state">
      <div class="empty-icon">🤖</div>
      <h2>你好,我是 AI 助手</h2>
      <p>输入问题开始对话,或点击 🎤 使用语音输入</p>
      <div class="suggestions">
        <button class="suggestion" @click="chatStore.sendMessage('你能做什么?')">
          💡 你能做什么?
        </button>
        <button class="suggestion" @click="chatStore.sendMessage('用 Vue 3 写一个组件示例')">
          ⚛️ 写代码
        </button>
        <button class="suggestion" @click="chatStore.sendMessage('帮我解释一下 Web Speech API')">
          🎤 解释 API
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div v-else class="messages">
      <MessageItem
        v-for="msg in chatStore.messages"
        :key="msg.id"
        :message="msg"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
  scroll-behavior: smooth;
}

.messages {
  max-width: 860px;
  margin: 0 auto;
  padding: 8px 0;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-state h2 {
  font-size: 22px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 560px;
}

.suggestion {
  padding: 10px 18px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.suggestion:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
  .chat-window {
    padding: 16px 12px;
  }
}
</style>
