/**
 * Sidebar component
 * Shows logo, indexed website status, and action buttons
 */
import { Globe, Trash2, RefreshCw, Zap, Settings, ExternalLink } from 'lucide-react'
import { WebsiteMetadata } from '@/services/api'
import { IndexingPhase } from '@/hooks/useIndexing'

interface SidebarProps {
  phase: IndexingPhase
  website: WebsiteMetadata | null
  indexedUrl: string
  onDelete: () => void
  onReIndex: () => void
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

export default function Sidebar({ phase, website, indexedUrl, onDelete, onReIndex }: SidebarProps) {
  const isIndexed = phase === 'done' && website !== null
  const isIndexing = phase === 'indexing'

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          flexShrink: 0,
        }}>
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            SiteMind
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI Website Chat</div>
        </div>
      </div>

      {/* Indexed Website Section */}
      <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Indexed Website
        </div>

        {!isIndexed && !isIndexing && (
          <div style={{
            padding: '14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <Globe size={22} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              No website indexed yet.<br />Paste a URL to get started.
            </p>
          </div>
        )}

        {isIndexing && (
          <div style={{
            padding: '14px',
            background: 'var(--accent-dim)',
            borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'pulse-dot 1s ease infinite',
              }} />
              <span style={{ fontSize: 12, color: 'var(--accent-hover)', fontWeight: 500 }}>
                Indexing...
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {getDomain(indexedUrl)}
            </p>
          </div>
        )}

        {isIndexed && website && (
          <div style={{
            padding: '14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            {/* Domain */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
              <Globe size={14} color="var(--accent-hover)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {website.title || getDomain(website.url)}
                </div>
                <a
                  href={website.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                >
                  {getDomain(website.url)}
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Pages', value: website.total_pages },
                { label: 'Chunks', value: website.total_chunks },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg-overlay)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Status badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 12, fontSize: 11, color: 'var(--success)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
              Ready to chat • {formatDate(website.indexed_at)}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={onReIndex}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 7,
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', width: '100%',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <RefreshCw size={13} />
                Re-index
              </button>
              <button
                onClick={onDelete}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 7,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--error)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', width: '100%',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={13} />
                Delete Index
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-muted)',
        cursor: 'not-allowed',
        fontSize: 12,
      }}>
        <Settings size={14} />
        <span>Settings</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
          soon
        </span>
      </div>
    </aside>
  )
}
