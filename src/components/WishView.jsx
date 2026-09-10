import { useState, useEffect } from 'react'

export default function WishView({ wish, onClose, onRelease }) {
  const [confirming, setConfirming] = useState(false)
  const [releasing, setReleasing] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleRelease = () => {
    setReleasing(true)
    setTimeout(() => onRelease(), 900)
  }

  const date = new Date(wish.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className={`wish-overlay ${releasing ? 'releasing' : ''}`}
      onClick={onClose}
    >
      <div className="wish-paper" onClick={(e) => e.stopPropagation()}>
        <div className="wish-top">
          <span className="wish-eyebrow">a wish</span>
          <span className="wish-date">{date}</span>
        </div>

        <p className="wish-body">{wish.body}</p>

        {wish.author && (
          <p className="wish-author">
            — <span>{wish.author}</span>
          </p>
        )}

        <div className="wish-actions">
          <button className="wish-btn ghost" onClick={onClose}>
            Let it drift
          </button>

          {!confirming ? (
            <button
              className="wish-btn danger"
              onClick={() => setConfirming(true)}
            >
              Release it
            </button>
          ) : (
            <div className="wish-confirm">
              <span>Gone forever?</span>
              <button
                className="wish-btn ghost small"
                onClick={() => setConfirming(false)}
              >
                No
              </button>
              <button
                className="wish-btn danger small"
                onClick={handleRelease}
              >
                Yes, release
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}