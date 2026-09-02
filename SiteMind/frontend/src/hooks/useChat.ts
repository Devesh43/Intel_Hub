/**
 * useChat hook
 * Manages the chat conversation state and SSE streaming
 */
import { useState, useRef, useCallback } from 'react'
import { streamChat, ChatSource } from '@/services/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  timestamp: Date
  isStreaming?: boolean
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  sendMessage: (question: string) => void
  clearChat: () => void
}

let msgId = 0
const nextId = () => String(++msgId)

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)

  const sendMessage = useCallback((question: string) => {
    if (isStreaming || !question.trim()) return

    // Cancel any ongoing stream
    cancelRef.current?.()

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    }

    const assistantId = nextId()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    const history = messages
      .filter(m => m.content.trim() && !m.isStreaming)
      .map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsStreaming(true)

    cancelRef.current = streamChat(
      question,
      // onToken
      (token) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: m.content + token }
              : m
          )
        )
      },
      // onSources
      (sources) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, sources } : m
          )
        )
      },
      // onError
      (err) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `⚠️ Error: ${err}`, isStreaming: false }
              : m
          )
        )
        setIsStreaming(false)
      },
      // onDone
      () => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        )
        setIsStreaming(false)
      },
      history,
    )
  }, [isStreaming])

  const clearChat = useCallback(() => {
    cancelRef.current?.()
    setMessages([])
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, clearChat }
}
