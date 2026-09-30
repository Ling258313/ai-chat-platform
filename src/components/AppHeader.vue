<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useNewConversation } from '@/composables/useNewConversation'
import { useSettingsStore } from '@/stores/settings'
import type { ThemeMode } from '@/types'

const route = useRoute()
const handleNewChat = useNewConversation()
const settingsStore = useSettingsStore()

const THEME_ORDER: ThemeMode[] = ['system', 'light', 'dark']
const THEME_ICON: Record<ThemeMode, string> = { system: '🌗', light: '☀️', dark: '🌙' }
const THEME_LABEL: Record<ThemeMode, string> = { system: '跟随系统', light: '浅色', dark: '深色' }

function cycleTheme() {
  const current = settingsStore.settings.theme ?? 'system'
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length]!
  settingsStore.updateSettings({ theme: next })
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
      <button
        class="theme-btn"
        :title="'主题：' + THEME_LABEL[settingsStore.settings.theme ?? 'system'] + '（点击切换）'"
        :aria-label="'切换主题，当前' + THEME_LABEL[settingsStore.settings.theme ?? 'system']"
        @click="cycleTheme"
      >
        {{ THEME_ICON[settingsStore.settings.theme ?? 'system'] }}
      </button>
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

.theme-btn {
  width: 32px;
  height: 32px;
  margin-right: 4px;
  border-radius: var(--radius-md);
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.theme-btn:hover {
  background: var(--border-light);
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
