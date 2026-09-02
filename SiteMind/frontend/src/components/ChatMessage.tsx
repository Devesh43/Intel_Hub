/**
 * ChatMessage component
 * Renders a single user or assistant message with markdown and copy support
 */
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Bot, User } from 'lucide-react'
import { ChatMessage as ChatMessageType } from '@/hooks/useChat'
import SourcesList from './SourcesList'

interface ChatMessageProps {
  message: ChatMessageType
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isStreaming = message.isStreaming

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12,
        alignItems: 'flex-start',
        padding: '8px 0',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUser ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
      }}>
        {isUser
          ? <User size={15} color="#fff" />
          : <Bot size={15} color="var(--accent-hover)" />
        }
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* Name + time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {isUser ? 'You' : 'SiteMind'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message content */}
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isUser ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'var(--bg-elevated)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: isUser ? '#fff' : 'var(--text-primary)',
          boxShadow: isUser
            ? '0 2px 12px rgba(99,102,241,0.25)'
            : '0 1px 4px rgba(0,0,0,0.2)',
          position: 'relative',
          minWidth: 60,
        }}>
          {isUser ? (
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{message.content}</p>
          ) : (
            <div className={`prose ${isStreaming && !message.content ? 'typing-cursor' : ''}`}>
              {message.content ? (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Open links in new tab
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer">{children}</a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {isStreaming && <span className="typing-cursor" />}
                </>
              ) : (
                <span className="typing-cursor" style={{ fontSize: 14 }}>&nbsp;</span>
              )}
            </div>
          )}

          {/* Copy button (assistant only, not streaming) */}
          {!isUser && !isStreaming && message.content && (
            <button
              onClick={handleCopy}
              title="Copy response"
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 6px',
                cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                opacity: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              className="copy-btn"
            >
              {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <SourcesList sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  )
}
