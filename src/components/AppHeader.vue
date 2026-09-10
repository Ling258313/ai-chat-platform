<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()

function handleNewChat() {
  chatStore.createConversation()
  router.push('/')
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="icon-btn new-chat" title="新建对话" @click="handleNewChat">
        <span class="icon">✏️</span>
        <span class="label">新建对话</span>
      </button>
    </div>

    <div class="header-center">
      <h1 class="brand">
        <span class="brand-icon">🤖</span>
        <span>AI 对话平台</span>
      </h1>
    </div>

    <div class="header-right">
      <RouterLink
        to="/"
        class="nav-btn"
        :class="{ active: route.path === '/' }"
      >
        💬 对话
      </RouterLink>
      <RouterLink
        to="/settings"
        class="nav-btn"
        :class="{ active: route.path === '/settings' }"
      >
        ⚙️ 设置
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  width: 180px;
}

.header-center {
  flex: 1;
  text-align: center;
}

.brand {
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.brand-icon {
  font-size: 22px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 180px;
  justify-content: flex-end;
}

.new-chat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.new-chat:hover {
  background: var(--primary-dark);
}

.nav-btn {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

.nav-btn.active {
  background: var(--primary-bg);
  color: var(--primary);
}

@media (max-width: 768px) {
  .header-left {
    width: auto;
  }
  .label {
    display: none;
  }
  .header-right {
    width: auto;
  }
  .brand span:last-child {
    display: none;
  }
}
</style>
