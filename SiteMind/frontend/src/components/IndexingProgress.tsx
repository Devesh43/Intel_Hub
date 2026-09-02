/**
 * IndexingProgress component
 * Displayed while a website is being indexed.
 * Shows live step log, progress bar, and page counter.
 */
import { IndexStatus } from '@/services/api'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface IndexingProgressProps {
  status: IndexStatus | null
  url: string
}

const STEPS = [
  { state: 'crawling',   label: 'Crawling pages...' },
  { state: 'extracting', label: 'Extracting content...' },
  { state: 'chunking',   label: 'Splitting into chunks...' },
  { state: 'embedding',  label: 'Creating embeddings...' },
  { state: 'saving',     label: 'Saving to knowledge base...' },
  { state: 'done',       label: 'Done!' },
]

const STATE_ORDER = ['crawling', 'extracting', 'chunking', 'embedding', 'saving', 'done']

function stepStatus(stepState: string, currentState: string): 'done' | 'active' | 'pending' {
  const stepIdx = STATE_ORDER.indexOf(stepState)
  let currIdx = STATE_ORDER.indexOf(currentState)
  if (currIdx === -1) currIdx = 0 // Default to crawling step if idle/starting
  if (stepIdx < currIdx) return 'done'
  if (stepIdx === currIdx) return 'active'
  return 'pending'
}

export default function IndexingProgress({ status, url }: IndexingProgressProps) {
  const progress = status?.progress ?? 0
  const currentState = status?.state ?? 'crawling'
  const message = status?.message ?? 'Starting...'

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '32px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Loader2 size={24} color="var(--accent-hover)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Indexing Website
          </h2>
          <p style={{
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            wordBreak: 'break-all',
          }}>
            {url}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>{message}</span>
            <span style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Page counter */}
        {status && status.pages_crawled > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 24, textAlign: 'right' }}>
            {status.pages_crawled} pages discovered
            {status.chunks_created > 0 && ` • ${status.chunks_created} chunks`}
          </div>
        )}

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map(step => {
            const s = stepStatus(step.state, currentState)
            return (
              <div key={step.state} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: s === 'pending' ? 0.35 : 1,
                transition: 'opacity 0.3s',
              }}>
                {s === 'done' && <CheckCircle2 size={16} color="var(--success)" />}
                {s === 'active' && <Loader2 size={16} color="var(--accent-hover)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                {s === 'pending' && <Circle size={16} color="var(--text-muted)" />}
                <span style={{
                  fontSize: 13,
                  color: s === 'active' ? 'var(--text-primary)' : s === 'done' ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: s === 'active' ? 500 : 400,
                }}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
