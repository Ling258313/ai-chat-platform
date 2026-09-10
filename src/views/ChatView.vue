<script setup lang="ts">
import { onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatWindow from '@/components/ChatWindow.vue'
import ChatInput from '@/components/ChatInput.vue'

const chatStore = useChatStore()

onMounted(() => {
  // 进入页面时,如果没有会话则创建一个
  if (!chatStore.hasConversations) {
    chatStore.createConversation()
  } else if (!chatStore.activeConversationId) {
    chatStore.selectConversation(chatStore.conversations[0]!.id)
  }
})
</script>

<template>
  <div class="chat-view">
    <ChatWindow />
    <ChatInput />
  </div>
</template>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-chat);
}
</style>
