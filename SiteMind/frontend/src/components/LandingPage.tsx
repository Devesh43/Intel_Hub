/**
 * LandingPage component
 * Shown when no website is indexed. Contains the URL input + Index button.
 */
import { useState, FormEvent } from 'react'
import { Globe, ArrowRight, Zap, Search, MessageCircle } from 'lucide-react'

interface LandingPageProps {
  onSubmit: (url: string) => void
  error: string | null
}

const FEATURES = [
  { icon: Globe, title: 'Smart Crawling', desc: 'Crawls up to 100 pages within your domain' },
  { icon: Search, title: 'Vector Search', desc: 'Semantic search across all indexed content' },
  { icon: MessageCircle, title: 'AI Chat', desc: 'Ask anything — get grounded, cited answers' },
]

const EXAMPLES = [
  'https://docs.python.org/3/',
  'https://react.dev',
  'https://tailwindcss.com/docs',
]

export default function LandingPage({ onSubmit, error }: LandingPageProps) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (url.trim()) onSubmit(url.trim())
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', overflow: 'auto',
      background: 'var(--bg-base)',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 580, animation: 'fadeIn 0.4s ease both' }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 40px rgba(99,102,241,0.3)',
        }}>
          <Zap size={28} color="#fff" strokeWidth={2.5} />
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          marginBottom: 16,
        }}>
          Chat with any Website
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Index any website and instantly ask questions about its content.<br />
          Powered by Gemini — grounded answers only from your indexed site.
        </p>
      </div>

      {/* URL Input Card */}
      <div style={{
        width: '100%', maxWidth: 580,
        background: 'var(--bg-surface)',
        border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: '24px',
        boxShadow: focused ? '0 0 0 3px var(--accent-dim)' : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        animation: 'fadeIn 0.5s 0.1s ease both',
      }}>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Website URL
          </label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Globe size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="https://example.com"
              required
              style={{
                width: '100%',
                padding: '13px 14px 13px 40px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)', fontSize: 13, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Index Website
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Example links */}
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Try:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setUrl(ex)}
              style={{
                fontSize: 11, color: 'var(--accent-hover)',
                background: 'var(--accent-dim)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 6, padding: '4px 10px',
                cursor: 'pointer', fontFamily: 'monospace',
              }}
            >
              {new URL(ex).hostname}
            </button>
          ))}
        </div>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center',
        animation: 'fadeIn 0.6s 0.2s ease both',
      }}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={15} color="var(--accent-hover)" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
