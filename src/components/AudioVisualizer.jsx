'use client'

import { useEffect, useRef } from 'react'

const BARS = 40

function drawRoundedBar(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, height / 2, width / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.arcTo(x + width, y, x + width, y + r, r)
  ctx.lineTo(x + width, y + height - r)
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r)
  ctx.lineTo(x + r, y + height)
  ctx.arcTo(x, y + height, x, y + height - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/**
 * Canvas soundwave. When `analyser` is provided (live mic input) it renders
 * real frequency data; otherwise it renders an ambient synthetic wave —
 * used both when idle (flat line) and during TTS playback (browsers expose
 * no audio analyser for speechSynthesis, so we animate instead).
 */
export default function AudioVisualizer({ analyser, active, mode = 'input', color = '#059669', height = 64 }) {
  const canvasRef = useRef(null)
  const smoothRef = useRef(new Array(BARS).fill(4))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    let raf = 0
    let t = 0
    const smooth = smoothRef.current
    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = () => {
      t += 0.06
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      if (analyser && mode === 'input') {
        analyser.getByteFrequencyData(freqData)
      }

      const barWidth = w / BARS
      ctx.fillStyle = color
      for (let i = 0; i < BARS; i++) {
        let target
        if (analyser && mode === 'input' && freqData) {
          const index = Math.floor((i / BARS) * freqData.length * 0.7)
          target = (freqData[index] / 255) * h * 0.92
        } else if (active) {
          const base = h * 0.32
          target =
            base *
            (0.35 + Math.abs(Math.sin(t * 1.4 + i * 0.55)) * 0.9) *
            (0.6 + 0.4 * Math.sin(t * 0.5 + i))
        } else {
          target = 3
        }
        smooth[i] += (target - smooth[i]) * (analyser && mode === 'input' ? 0.35 : 0.12)
        const barHeight = Math.max(3, smooth[i])
        drawRoundedBar(ctx, i * barWidth + barWidth * 0.18, h / 2 - barHeight / 2, barWidth * 0.64, barHeight, barWidth * 0.32)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [analyser, active, mode, color])

  return <canvas ref={canvasRef} className="w-full" style={{ height }} aria-hidden="true" />
}
