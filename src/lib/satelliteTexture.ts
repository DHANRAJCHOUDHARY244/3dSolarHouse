/**
 * Soft aerial ground — no road strokes / dashed marks (those read as ugly lines).
 */
export function createSatelliteTexture(size = 2048): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.72)
  g.addColorStop(0, '#627846')
  g.addColorStop(0.5, '#4f6338')
  g.addColorStop(1, '#354428')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const img = ctx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.55))
  }
  ctx.putImageData(img, 0, 0)

  for (let i = 0; i < 240; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 14 + Math.random() * 65
    const leaf = ctx.createRadialGradient(x, y, 0, x, y, r)
    const t = 75 + Math.random() * 45
    leaf.addColorStop(0, `rgba(${t * 0.38}, ${t}, ${t * 0.3}, 0.8)`)
    leaf.addColorStop(1, 'rgba(30,45,22,0)')
    ctx.fillStyle = leaf
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Soft lawn / dirt patches only (no line strokes)
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(${90 + Math.random() * 40}, ${110 + Math.random() * 30}, ${70 + Math.random() * 20}, 0.28)`
    ctx.beginPath()
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      40 + Math.random() * 90,
      25 + Math.random() * 60,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  const roofs: [number, number, number, number, string][] = [
    [0.1, 0.15, 0.09, 0.07, '#8a8680'],
    [0.75, 0.12, 0.11, 0.08, '#7a7068'],
    [0.82, 0.55, 0.1, 0.08, '#6e7470'],
    [0.08, 0.55, 0.1, 0.09, '#908070'],
    [0.7, 0.78, 0.12, 0.09, '#787468'],
  ]
  for (const [fx, fy, fw, fh, c] of roofs) {
    ctx.fillStyle = c
    ctx.fillRect(fx * size, fy * size, fw * size, fh * size)
  }

  ctx.fillStyle = 'rgba(155, 135, 105, 0.55)'
  ctx.fillRect(size * 0.32, size * 0.36, size * 0.36, size * 0.3)

  return canvas
}
