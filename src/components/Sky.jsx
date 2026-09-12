import { useEffect, useRef } from 'react'
import { Lantern, Ember, makeStars, drawStars } from '../lib/lantern'

export default function Sky({ wishes, onOpen, paused }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    lanterns: new Map(),
    embers: [],
    stars: null,
    size: { w: 0, h: 0 },
    pointer: { x: 0, y: 0, active: false },
    mouse: { x: 0.5, y: 0.5 },
    hoveredId: null,
    lastTime: 0,
    paused: false,
  })

  useEffect(() => {
    stateRef.current.paused = paused
  }, [paused])

  useEffect(() => {
    const state = stateRef.current
    const granted = wishes.filter((w) => w.verdict === 'GRANTED')
    const wanted = new Set(granted.map((w) => w.id))

    for (const [id, lantern] of state.lanterns) {
      if (!wanted.has(id)) {
        const { x, y, hue, h: lh } = lantern
        for (let i = 0; i < 90; i++) {
          state.embers.push(new Ember(x, y - lh * 0.2, hue))
        }
        state.lanterns.delete(id)
      }
    }

    const { w, h } = state.size
    if (w && h) {
      for (const wish of granted) {
        if (!state.lanterns.has(wish.id)) {
          state.lanterns.set(wish.id, new Lantern(wish, w, h))
        }
      }
    }
  }, [wishes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const state = stateRef.current

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      state.size = { w, h }
      state.stars = makeStars(w, h, Math.round((w * h) / 5500))
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e
      state.pointer.x = p.clientX
      state.pointer.y = p.clientY
      state.pointer.active = true
      state.mouse.x = p.clientX / state.size.w
      state.mouse.y = p.clientY / state.size.h
    }
    const onLeave = () => {
      state.pointer.active = false
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onLeave)

    const onDown = (e) => {
      const p = e.changedTouches ? e.changedTouches[0] : e
      const x = p.clientX
      const y = p.clientY
      let hit = null
      for (const lantern of state.lanterns.values()) {
        if (lantern.contains(x, y)) hit = lantern
      }
      if (hit) onOpen(hit.wish.id)
    }
    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('touchstart', onDown, { passive: true })

    let raf
    const loop = (now) => {
      const dt = Math.min(0.05, (now - state.lastTime) / 1000 || 0.016)
      state.lastTime = now
      const { w, h } = state.size

      drawStars(ctx, state.stars, w, h, now, state.mouse)

      let hoveredId = null
      if (!state.paused && state.pointer.active) {
        for (const lantern of state.lanterns.values()) {
          if (lantern.contains(state.pointer.x, state.pointer.y)) {
            hoveredId = lantern.wish.id
            break
          }
        }
      }
      state.hoveredId = hoveredId

      for (const lantern of state.lanterns.values()) {
        if (!state.paused) {
          lantern.update(dt, w, h, state.pointer, now)
        }
        lantern.draw(ctx)

        if (hoveredId === lantern.wish.id) {
          ctx.strokeStyle = `hsla(${lantern.hue}, 90%, 70%, 0.55)`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(lantern.x, lantern.y, lantern.w * 1.6, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      for (let i = state.embers.length - 1; i >= 0; i--) {
        const em = state.embers[i]
        em.update(dt)
        em.draw(ctx)
        if (em.life <= 0) state.embers.splice(i, 1)
      }

      if (state.pointer.active) {
        ctx.fillStyle = 'rgba(201, 169, 97, 0.35)'
        ctx.beginPath()
        ctx.arc(state.pointer.x, state.pointer.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onLeave)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('touchstart', onDown)
    }
  }, [onOpen])

  return <canvas ref={canvasRef} className="sky" aria-hidden="true" />
}