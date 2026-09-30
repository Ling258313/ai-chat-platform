import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

/**
 * 「新建对话」这个动作的唯一定义处。
 *
 * 背景:顶栏和侧边栏各有一个「新建对话」按钮,一开始两处各写了一遍逻辑,
 * 结果侧边栏那处漏了跳转 —— 在设置页点它,会话建出来了,人却还停在设置页。
 * 现在两个入口都调这里,不会再漏。
 *
 * 注意:跳转不放在 chat store 里,是为了让 store 保持纯状态、不依赖路由。
 */
export function useNewConversation() {
  const router = useRouter()
  const chatStore = useChatStore()

  return function newConversation() {
    chatStore.createConversation()
    // 已在对话页时这次 push 是空操作,vue-router 会自己跳过重复导航
    router.push('/')
  }
}