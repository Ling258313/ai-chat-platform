<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useNewConversation } from '@/composables/useNewConversation'

const chatStore = useChatStore()

// 新建对话要跳到对话页，这段逻辑和顶栏共用（见 @/composables/useNewConversation）
const newConversation = useNewConversation()

/** 处于"待确认删除"状态的会话 id —— 两步确认,防止误删无法恢复的本地聊天记录 */
const pendingDeleteId = ref<string | null>(null)


function selectConversation(id: string) {
  // 点击行内其它区域 = 取消待确认状态
  pendingDeleteId.value = null
  chatStore.selectConversation(id)
}

function requestDelete(id: string) {
  pendingDeleteId.value = id
}

function cancelDelete() {
  pendingDeleteId.value = null
}

function confirmDelete(id: string) {
  chatStore.deleteConversation(id)
  pendingDeleteId.value = null
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
        :class="{
          active: conv.id === chatStore.activeConversationId,
          confirming: pendingDeleteId === conv.id,
        }"
        role="button"
        tabindex="0"
        @click="selectConversation(conv.id)"
        @keydown.enter="selectConversation(conv.id)"
      >
        <!-- 待确认删除:整行换成确认条 -->
        <template v-if="pendingDeleteId === conv.id">
          <span class="confirm-text">确定删除该对话?</span>
          <button
            class="confirm-btn danger"
            @click.stop="confirmDelete(conv.id)"
          >
            删除
          </button>
          <button class="confirm-btn" @click.stop="cancelDelete">取消</button>
        </template>

        <template v-else>
          <span class="item-icon">💬</span>
          <div class="item-body">
            <div class="item-title">{{ conv.title }}</div>
            <div class="item-time">{{ formatTime(conv.createdAt) }}</div>
          </div>
          <button
            class="del-btn"
            title="删除对话"
            aria-label="删除对话"
            @click.stop="requestDelete(conv.id)"
          >
            ✕
          </button>
        </template>
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

/* 待确认删除状态 */
.item.confirming {
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  cursor: default;
}

.confirm-text {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--danger);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.confirm-btn {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.confirm-btn:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

.confirm-btn.danger {
  background: var(--danger);
  color: #fff;
}

.confirm-btn.danger:hover {
  background: #dc2626;
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
