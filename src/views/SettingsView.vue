<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const saved = ref(false)

function saveSettings() {
  // settings store 会自动持久化
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-container">
      <h1 class="page-title">⚙️ 设置</h1>
      <p class="page-desc">配置你的 AI 服务参数,设置会保存在本地浏览器中</p>

      <div class="settings-card">
        <h2 class="section-title">🤖 AI 服务配置</h2>

        <div class="form-group">
          <label class="form-label">API 地址</label>
          <input
            v-model="settingsStore.settings.apiBaseUrl"
            class="form-input"
            type="text"
            placeholder="留空即走本地 Node 服务(推荐)"
          >
          <p class="form-hint">
            留空时请求本地 Node 服务(见 server/ 目录),大模型密钥保存在服务端环境变量里,浏览器不会拿到;
            填写地址则直连该服务,此时密钥会存进浏览器 localStorage,仅建议本地调试时使用。
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">API Key</label>
          <input
            v-model="settingsStore.settings.apiKey"
            class="form-input"
            type="password"
            placeholder="sk-..."
            autocomplete="off"
          >
          <p class="form-hint">
            走本地 Node 服务时无需填写;直连模式下会明文保存在浏览器 localStorage 中,存在泄露风险。
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">模型名称</label>
          <input
            v-model="settingsStore.settings.model"
            class="form-input"
            type="text"
            placeholder="deepseek-v4-flash / gpt-4o-mini / deepseek-chat"
          >
        </div>

        <div class="form-group">
          <label class="form-label">系统提示词</label>
          <textarea
            v-model="settingsStore.settings.systemPrompt"
            class="form-textarea"
            rows="3"
            placeholder="定义 AI 的角色和行为"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            温度 ({{ settingsStore.settings.temperature }})
          </label>
          <input
            v-model.number="settingsStore.settings.temperature"
            class="form-range"
            type="range"
            min="0"
            max="2"
            step="0.1"
          >
          <p class="form-hint">较低的值更确定,较高的值更有创造性。</p>
        </div>

        <div class="form-group">
          <label class="form-label">朗读设置</label>
          <label class="checkbox-label">
            <input
              v-model="settingsStore.settings.autoSpeak"
              type="checkbox"
            >
            自动朗读 AI 的回复
          </label>
        </div>

        <div class="form-actions">
          <button class="btn-primary" @click="saveSettings">
            {{ saved ? '✓ 已保存' : '保存设置' }}
          </button>
          <button class="btn-secondary" @click="settingsStore.resetSettings()">
            恢复默认
          </button>
        </div>
      </div>

      <div class="settings-card">
        <h2 class="section-title">🎤 语音功能说明</h2>
        <ul class="info-list">
          <li>语音识别需要浏览器支持(<b>Chrome / Edge / Safari</b>)</li>
          <li>本地开发(localhost)可直接使用,线上需要 <b>HTTPS</b></li>
          <li>Firefox 不支持语音识别,但支持语音合成朗读</li>
          <li>语音识别准确度取决于系统语言包和网络</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
}

.settings-container {
  max-width: 720px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-desc {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.settings-card {
  background: var(--bg-sidebar);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-size: 14px;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.form-range {
  width: 100%;
  accent-color: var(--primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary {
  padding: 10px 24px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  padding: 10px 24px;
  background: var(--border-light);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--border);
  color: var(--text-primary);
}

.info-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-list li {
  padding-left: 20px;
  position: relative;
  font-size: 13px;
  color: var(--text-secondary);
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: var(--primary);
  font-weight: bold;
}
</style>
