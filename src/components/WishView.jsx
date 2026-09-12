import { useState, useEffect } from 'react'

export default function WishView({ wish, onClose, onMarkFulfilled }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const today = new Date()
  const dueDate = wish.dateISO ? new Date(wish.dateISO) : null
  const daysLeft = dueDate
    ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
    : null
  const isDue = daysLeft !== null && daysLeft <= 0

  return (
    <div className="wish-overlay" onClick={onClose}>
      <div className="wish-paper" onClick={(e) => e.stopPropagation()}>
        <div className="wish-top">
          <span className="wish-eyebrow">granted</span>
          {dueDate && (
            <span className="wish-date">{wish.dateString}</span>
          )}
        </div>

        <p className="wish-body">{wish.wish}</p>

        {wish.why && (
          <p className="wish-why">
            <span className="wish-why-label">because</span>
            {wish.why}
          </p>
        )}

        <div className="wish-meta">
          <div className="wish-meta-row">
            <span className="wish-meta-label">Watch for</span>
            <span className="wish-meta-value">{wish.sign}</span>
          </div>
          {daysLeft !== null && !isDue && (
            <div className="wish-meta-row">
              <span className="wish-meta-label">Opens in</span>
              <span className="wish-meta-value">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
          {isDue && !wish.fulfilled && (
            <div className="wish-meta-row">
              <span className="wish-meta-label">Ask now</span>
              <span className="wish-meta-value">Did it come?</span>
            </div>
          )}
        </div>

        <div className="wish-actions">
          <button className="wish-btn ghost" onClick={onClose}>
            Close
          </button>

          {isDue && !wish.fulfilled && (
            <>
              {!confirming ? (
                <button
                  className="wish-btn gold"
                  onClick={() => setConfirming(true)}
                >
                  It came true
                </button>
              ) : (
                <div className="wish-confirm">
                  <span>Seal it as fulfilled?</span>
                  <button
                    className="wish-btn ghost small"
                    onClick={() => setConfirming(false)}
                  >
                    No
                  </button>
                  <button
                    className="wish-btn gold small"
                    onClick={() => onMarkFulfilled(wish.id)}
                  >
                    Yes
                  </button>
                </div>
              )}
            </>
          )}

          {wish.fulfilled && (
            <span className="wish-fulfilled">✦ sealed in gold</span>
          )}
        </div>
      </div>
    </div>
  )
}