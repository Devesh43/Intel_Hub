/**
 * SourcesList component
 * Renders a list of source citations below an AI message
 */
import { ExternalLink } from 'lucide-react'
import { ChatSource } from '@/services/api'

interface SourcesListProps {
  sources: ChatSource[]
}

export default function SourcesList({ sources }: SourcesListProps) {
  if (!sources.length) return null

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
      }}>
        Sources
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '8px 12px',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
              e.currentTarget.style.background = 'rgba(99,102,241,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.background = 'var(--bg-overlay)'
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              background: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 10, color: 'var(--accent-hover)', fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {source.title || source.url}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {source.url}
              </div>
            </div>
            <ExternalLink size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
          </a>
        ))}
      </div>
    </div>
  )
}
