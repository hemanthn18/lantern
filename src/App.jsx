import { useState, useEffect, useCallback } from 'react'
import Sky from './components/Sky'
import Composer from './components/Composer'
import WishView from './components/WishView'
import './App.css'

const STORAGE_KEY = 'lantern-wishes'

export default function App() {
  const [wishes, setWishes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [composerOpen, setComposerOpen] = useState(false)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes))
  }, [wishes])

  const addWish = useCallback((body, author) => {
    const hue = 28 + Math.random() * 22
    const wish = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      body,
      author: author || '',
      hue,
      createdAt: new Date().toISOString(),
    }
    setWishes((prev) => [...prev, wish])
    setComposerOpen(false)
  }, [])

  const releaseWish = useCallback((id) => {
    setWishes((prev) => prev.filter((w) => w.id !== id))
    setOpenId(null)
  }, [])

  const openWish = useCallback((id) => setOpenId(id), [])
  const closeWish = useCallback(() => setOpenId(null), [])

  const openWishData = wishes.find((w) => w.id === openId)

  return (
    <div className="app">
      <Sky
        wishes={wishes}
        onOpen={openWish}
        paused={composerOpen || !!openId}
      />

      <header className="hud hud-top">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span className="brand-name">Lantern</span>
        </div>
        <div className="count">
          {wishes.length === 0
            ? 'the sky is quiet'
            : `${wishes.length} ${wishes.length === 1 ? 'wish' : 'wishes'} adrift`}
        </div>
      </header>

      <div className="hud hud-bottom">
        <button className="write-btn" onClick={() => setComposerOpen(true)}>
          <span className="write-icon">✦</span>
          Write a wish
        </button>
        <p className="hint">move close to a lantern — it knows</p>
      </div>

      {composerOpen && (
        <Composer onClose={() => setComposerOpen(false)} onSubmit={addWish} />
      )}

      {openWishData && (
        <WishView
          wish={openWishData}
          onClose={closeWish}
          onRelease={() => releaseWish(openWishData.id)}
        />
      )}
    </div>
  )
}