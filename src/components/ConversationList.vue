<script setup lang="ts">
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

function newConversation() {
  chatStore.createConversation()
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>

<template>
  <div class="conversation-list">
    <div class="list-header">
      <span class="title">对话历史</span>
      <span class="count">{{ chatStore.conversations.length }}</span>
    </div>

    <button class="new-btn" @click="newConversation">
      <span class="plus">＋</span>
      新建对话
    </button>

    <div class="items">
      <div
        v-for="conv in chatStore.conversations"
        :key="conv.id"
        class="item"
        :class="{ active: conv.id === chatStore.activeConversationId }"
        role="button"
        tabindex="0"
        @click="chatStore.selectConversation(conv.id)"
        @keydown.enter="chatStore.selectConversation(conv.id)"
      >
        <span class="item-icon">💬</span>
        <div class="item-body">
          <div class="item-title">{{ conv.title }}</div>
          <div class="item-time">{{ formatTime(conv.createdAt) }}</div>
        </div>
        <button
          class="del-btn"
          title="删除对话"
          aria-label="删除对话"
          @click.stop="chatStore.deleteConversation(conv.id)"
        >
          ✕
        </button>
      </div>

      <div v-if="!chatStore.hasConversations" class="empty">
        还没有对话,点击上方按钮开始
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 12px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 12px;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--border-light);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.new-btn:hover {
  background: var(--primary-dark);
}

.plus {
  font-size: 16px;
  font-weight: 700;
}

.items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: var(--radius-md);
  text-align: left;
  transition: background 0.15s;
  position: relative;
  cursor: pointer;
  outline: none;
}

.item:focus-visible {
  box-shadow: 0 0 0 2px var(--primary);
}

.item:hover {
  background: var(--border-light);
}

.item.active {
  background: var(--primary-bg);
}

.item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.del-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 11px;
  color: var(--text-muted);
  display: none;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.item:hover .del-btn {
  display: flex;
}

.del-btn:hover {
  background: var(--danger);
  color: #fff;
}

.empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  padding: 24px 8px;
  line-height: 1.8;
}
</style>
