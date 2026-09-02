/**
 * ChatInterface component
 * Full ChatGPT-style interface with message list and input area
 */
import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { Send, Trash2, Globe, Sparkles } from 'lucide-react'
import ChatMessage from './ChatMessage'
import { ChatMessage as ChatMessageType } from '@/hooks/useChat'
import { WebsiteMetadata } from '@/services/api'

interface ChatInterfaceProps {
  messages: ChatMessageType[]
  isStreaming: boolean
  website: WebsiteMetadata
  onSend: (question: string) => void
  onClear: () => void
}

const SUGGESTIONS = [
  'What is this website about?',
  'What are the main topics covered?',
  'Give me a quick summary of the key information.',
  'What are the most important things I should know?',
]

function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

export default function ChatInterface({ messages, isStreaming, website, onSend, onClear }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    onSend(input.trim())
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 6px var(--success)',
        }} />
        <Globe size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {website.title || getDomain(website.url)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {website.total_pages} pages · {website.total_chunks} chunks
        </span>
        <div style={{ flex: 1 }} />
        {messages.length > 0 && (
          <button
            onClick={onClear}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={12} />
            Clear chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column',
      }}>
        {isEmpty ? (
          /* Empty state */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Sparkles size={24} color="var(--accent-hover)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Ready to answer your questions
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
              Ask anything about <strong style={{ color: 'var(--accent-hover)' }}>{getDomain(website.url)}</strong>
            </p>
            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); textareaRef.current?.focus() }}
                  style={{
                    padding: '9px 14px', borderRadius: 10,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 820, width: '100%', margin: '0 auto' }}>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 820, margin: '0 auto',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          display: 'flex', alignItems: 'flex-end', gap: 0,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'border-color 0.15s',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${getDomain(website.url)}...`}
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1, padding: '14px 16px',
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6,
              resize: 'none', fontFamily: 'inherit',
              maxHeight: 160, overflow: 'auto',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              width: 42, height: 42, margin: '8px',
              borderRadius: 10, border: 'none',
              background: !input.trim() || isStreaming
                ? 'var(--bg-overlay)'
                : 'linear-gradient(135deg, #6366f1, #7c3aed)',
              cursor: !input.trim() || isStreaming ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
              boxShadow: !input.trim() || isStreaming ? 'none' : '0 2px 10px rgba(99,102,241,0.35)',
            }}
          >
            <Send size={16} color={!input.trim() || isStreaming ? 'var(--text-muted)' : '#fff'} />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          Press Enter to send · Shift+Enter for new line · Answers sourced exclusively from indexed content
        </p>
      </div>
    </div>
  )
}
