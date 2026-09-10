// ============================================================
// Lantern — physics + rendering engine for the sky
// ============================================================

export const rand = (min, max) => min + Math.random() * (max - min)

// ------------------------------------------------------------
// Lantern entity
// ------------------------------------------------------------
export class Lantern {
  constructor(wish, w, h) {
    this.wish = wish
    this.hue = wish.hue || 32
    // Start somewhere in the middle band of the sky
    this.x = rand(w * 0.15, w * 0.85)
    this.y = rand(h * 0.2, h * 0.85)
    this.vx = rand(-6, 6)
    this.vy = rand(-10, -4) // gentle rise
    this.baseW = 42
    this.w = this.baseW
    this.h = this.baseW * 1.35
    this.phase = rand(0, Math.PI * 2)
    this.fleeRadius = 38
    this.dead = false
    this.spawnedAt = performance.now()
    this.alpha = 0
    this.heartbeat = rand(0.9, 1.4)
    this.heartbeatPhase = rand(0, Math.PI * 2)
    this.trail = []
  }

  update(dt, w, h, pointer, now) {
    const t = now * 0.001
    const age = (now - this.spawnedAt) / 1000

    // Fade in
    this.alpha = Math.min(1, age * 0.9)

    // Flee from pointer
    if (pointer.active) {
      const dx = this.x - pointer.x
      const dy = this.y - pointer.y
      const d2 = dx * dx + dy * dy
      const r = this.fleeRadius
      if (d2 < r * r) {
        const d = Math.max(Math.sqrt(d2), 0.001)
        const force = ((r - d) / r) * 150
        this.vx += (dx / d) * force * dt
        this.vy += (dy / d) * force * dt
      }
    }

    // Gentle sinusoidal sway
    this.vx += Math.sin(t * 0.6 + this.phase) * 6 * dt
    // Buoyancy — slight upward push, capped
    if (this.vy > -14) this.vy -= 4 * dt
    // Soft downward pull if it drifts too high
    if (this.y < h * 0.18) this.vy += 8 * dt
    // If too low, push up
    if (this.y > h * 0.9) this.vy -= 12 * dt

    // Drag
    this.vx *= 1 - 1.6 * dt
    this.vy *= 1 - 1.6 * dt

    // Integrate
    this.x += this.vx * dt * 6
    this.y += this.vy * dt * 6

    // Soft bounce off edges
    const pad = this.w * 0.6
    if (this.x < pad) {
      this.x = pad
      this.vx = Math.abs(this.vx) * 0.5 + 4
    }
    if (this.x > w - pad) {
      this.x = w - pad
      this.vx = -Math.abs(this.vx) * 0.5 - 4
    }
    if (this.y < h * 0.12) {
      this.y = h * 0.12
      this.vy = Math.abs(this.vy) * 0.4
    }
    if (this.y > h - pad) {
      this.y = h - pad
      this.vy = -Math.abs(this.vy) * 0.5 - 4
    }

    // Heartbeat — subtle scale pulse
    this.heartbeatPhase += dt * this.heartbeat
    const hb = 1 + Math.sin(this.heartbeatPhase) * 0.03
    this.w = this.baseW * hb
    this.h = this.baseW * 1.35 * hb

    // Occasional glow trail
    if (Math.random() < 0.25) {
      this.trail.push({ x: this.x, y: this.y + this.h * 0.2, life: 1 })
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt * 0.9
      this.trail[i].y -= 8 * dt
      if (this.trail[i].life <= 0) this.trail.splice(i, 1)
    }
  }

  contains(px, py) {
    const cx = this.x
    const cy = this.y
    const dx = (px - cx) / (this.w * 1.5)
    const dy = (py - cy) / (this.h * 1.7)
    return dx * dx + dy * dy <= 1
  }

  draw(ctx) {
    const a = this.alpha
    if (a <= 0) return
    const cx = this.x
    const cy = this.y
    const hue = this.hue

    // ---------- Ambient glow ----------
    const glowR = this.w * 4.5
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
    g.addColorStop(0, `hsla(${hue}, 90%, 68%, ${0.5 * a})`)
    g.addColorStop(0.35, `hsla(${hue}, 85%, 55%, ${0.14 * a})`)
    g.addColorStop(1, `hsla(${hue}, 80%, 45%, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
    ctx.fill()

    // ---------- Trail ----------
    for (const t of this.trail) {
      const tr = t.life * 2.5
      ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${t.life * 0.25 * a})`
      ctx.beginPath()
      ctx.arc(t.x, t.y, tr, 0, Math.PI * 2)
      ctx.fill()
    }

    // ---------- Lantern body ----------
    const w = this.w
    const h = this.h

    ctx.save()
    ctx.globalAlpha = a

    // Soft outer halo rim
    ctx.shadowColor = `hsla(${hue}, 95%, 65%, 0.9)`
    ctx.shadowBlur = 24

    // Paper body — rounded trapezoid
    const topW = w * 0.62
    const botW = w * 0.78
    const topY = cy - h * 0.45
    const botY = cy + h * 0.5

    const bodyGrad = ctx.createLinearGradient(cx - w, cy, cx + w, cy)
    bodyGrad.addColorStop(0, `hsla(${hue}, 80%, 58%, 0.95)`)
    bodyGrad.addColorStop(0.45, `hsla(${hue + 8}, 95%, 78%, 1)`)
    bodyGrad.addColorStop(1, `hsla(${hue}, 80%, 55%, 0.95)`)

    ctx.beginPath()
    ctx.moveTo(cx - topW / 2, topY)
    ctx.lineTo(cx + topW / 2, topY)
    ctx.quadraticCurveTo(cx + botW / 2 + 4, cy, cx + botW / 2, botY)
    ctx.lineTo(cx - botW / 2, botY)
    ctx.quadraticCurveTo(cx - botW / 2 - 4, cy, cx - topW / 2, topY)
    ctx.closePath()
    ctx.fillStyle = bodyGrad
    ctx.fill()

    // Inner flame glow
    ctx.shadowBlur = 0
    const innerG = ctx.createRadialGradient(
      cx,
      cy + h * 0.15,
      0,
      cx,
      cy + h * 0.15,
      w * 0.55
    )
    innerG.addColorStop(0, `hsla(48, 100%, 92%, ${0.9 * a})`)
    innerG.addColorStop(0.5, `hsla(${hue + 15}, 100%, 75%, ${0.5 * a})`)
    innerG.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`)
    ctx.fillStyle = innerG
    ctx.beginPath()
    ctx.arc(cx, cy + h * 0.15, w * 0.55, 0, Math.PI * 2)
    ctx.fill()

    // Vertical ribs
    ctx.strokeStyle = `hsla(${hue}, 60%, 35%, ${0.35 * a})`
    ctx.lineWidth = 1
    for (let i = -1; i <= 1; i++) {
      const rx = cx + i * (w * 0.18)
      ctx.beginPath()
      ctx.moveTo(rx, topY + 2)
      ctx.lineTo(cx + i * (w * 0.24), botY - 2)
      ctx.stroke()
    }

    // Top cap and bottom cap
    ctx.fillStyle = `hsla(${hue}, 50%, 25%, ${0.85 * a})`
    ctx.fillRect(cx - topW / 2 - 2, topY - 3, topW + 4, 3)
    ctx.fillRect(cx - botW / 2 - 1, botY, botW + 2, 3)

    // String below
    ctx.strokeStyle = `hsla(${hue}, 40%, 30%, ${0.5 * a})`
    ctx.beginPath()
    ctx.moveTo(cx, botY + 3)
    ctx.lineTo(cx, botY + 8)
    ctx.stroke()

    ctx.restore()
  }
}

// ------------------------------------------------------------
// Ember particles (when a wish is released)
// ------------------------------------------------------------
export class Ember {
  constructor(x, y, hue) {
    this.x = x
    this.y = y
    const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15)
    const speed = rand(60, 240)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.hue = hue + rand(-14, 14)
    this.life = 1
    this.decay = rand(0.35, 0.75)
    this.size = rand(1.5, 3.8)
    this.spin = rand(-1, 1)
    this.gravity = rand(40, 90)
  }
  update(dt) {
    this.life -= dt * this.decay
    this.vy += this.gravity * dt
    this.vx *= 1 - 0.9 * dt
    this.x += this.vx * dt
    this.y += this.vy * dt
  }
  draw(ctx) {
    if (this.life <= 0) return
    const a = Math.max(0, this.life)
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 6)
    g.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${a})`)
    g.addColorStop(0.4, `hsla(${this.hue}, 95%, 60%, ${a * 0.5})`)
    g.addColorStop(1, `hsla(${this.hue}, 90%, 50%, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `hsla(${this.hue}, 100%, 92%, ${a})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ------------------------------------------------------------
// Starfield (background stars)
// ------------------------------------------------------------
export function makeStars(w, h, count) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.3, 1.4),
      baseA: rand(0.2, 0.9),
      twinkle: rand(0.4, 1.6),
      phase: rand(0, Math.PI * 2),
      depth: rand(0.2, 1),
    })
  }
  return stars
}

export function drawStars(ctx, stars, w, h, now) {
  const t = now * 0.001
  // Sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#05040a')
  g.addColorStop(0.5, '#0a0813')
  g.addColorStop(1, '#0d0a0e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Subtle nebula
  const neb = ctx.createRadialGradient(w * 0.72, h * 0.22, 0, w * 0.72, h * 0.22, Math.max(w, h) * 0.7)
  neb.addColorStop(0, 'rgba(120, 80, 200, 0.07)')
  neb.addColorStop(0.4, 'rgba(200, 130, 90, 0.04)')
  neb.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = neb
  ctx.fillRect(0, 0, w, h)

  for (const s of stars) {
    const a = s.baseA * (0.5 + 0.5 * Math.sin(t * s.twinkle + s.phase))
    ctx.fillStyle = `rgba(240, 235, 220, ${a})`
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
}