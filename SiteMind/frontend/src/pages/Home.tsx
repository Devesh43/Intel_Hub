/**
 * Home page — root page that orchestrates all views
 */
import { useState, useEffect } from 'react'
import { useIndexing } from '@/hooks/useIndexing'
import { useChat } from '@/hooks/useChat'
import { getWebsite } from '@/services/api'
import Sidebar from '@/components/Sidebar'
import LandingPage from '@/components/LandingPage'
import IndexingProgress from '@/components/IndexingProgress'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  const { phase, status, error, startIndex, deleteCurrentIndex, reIndex } = useIndexing()
  const { messages, isStreaming, sendMessage, clearChat } = useChat()
  const [indexedUrl, setIndexedUrl] = useState('')
  const [website, setWebsite] = useState<any>(null)

  // On mount, check if a website is already indexed (e.g., after page refresh during indexing)
  useEffect(() => {
    getWebsite().then(res => {
      if (res.indexed && res.website) {
        setWebsite(res.website)
        setIndexedUrl(res.website.url)
        // Reflect done state (already indexed)
      }
    }).catch(() => {})
  }, [])

  // When indexing completes, fetch website metadata
  useEffect(() => {
    if (phase === 'done') {
      getWebsite().then(res => {
        if (res.indexed && res.website) setWebsite(res.website)
      }).catch(() => {})
    }
    if (phase === 'idle') {
      setWebsite(null)
    }
  }, [phase])

  const handleStartIndex = async (url: string) => {
    setIndexedUrl(url)
    clearChat()
    await startIndex(url)
  }

  const handleDelete = async () => {
    clearChat()
    setIndexedUrl('')
    setWebsite(null)
    await deleteCurrentIndex()
  }

  const handleReIndex = async () => {
    if (!indexedUrl) return
    clearChat()
    setWebsite(null)
    await reIndex(indexedUrl)
  }

  // Determine which main panel to show
  const showLanding = (phase === 'idle' || phase === 'error') && !website
  const showProgress = phase === 'indexing'
  const showChat = (phase === 'done' && website) || (!!website && phase === 'idle')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        phase={showChat ? 'done' : phase}
        website={website}
        indexedUrl={indexedUrl}
        onDelete={handleDelete}
        onReIndex={handleReIndex}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showLanding && (
          <LandingPage
            onSubmit={handleStartIndex}
            error={error}
          />
        )}
        {showProgress && (
          <IndexingProgress status={status} url={indexedUrl} />
        )}
        {showChat && website && (
          <ChatInterface
            messages={messages}
            isStreaming={isStreaming}
            website={website}
            onSend={sendMessage}
            onClear={clearChat}
          />
        )}
      </main>
    </div>
  )
}
