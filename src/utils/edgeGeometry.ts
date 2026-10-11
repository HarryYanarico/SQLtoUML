import { Position } from '@xyflow/react'

export const NODE_DEFAULTS = { width: 260, height: 80 }

export function getBorderPoint(
  nx: number, ny: number, nw: number, nh: number,
  ox: number, oy: number
): { x: number; y: number } {
  const cx = nx + nw / 2
  const cy = ny + nh / 2
  const dx = ox - cx
  const dy = oy - cy

  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const candidates: { x: number; y: number; t: number }[] = []

  if (dx > 0) {
    const t = (nx + nw - cx) / dx
    const y = cy + dy * t
    if (y >= ny && y <= ny + nh) candidates.push({ x: nx + nw, y, t })
  } else if (dx < 0) {
    const t = (nx - cx) / dx
    const y = cy + dy * t
    if (y >= ny && y <= ny + nh) candidates.push({ x: nx, y, t })
  }

  if (dy > 0) {
    const t = (ny + nh - cy) / dy
    const x = cx + dx * t
    if (x >= nx && x <= nx + nw) candidates.push({ x, y: ny + nh, t })
  } else if (dy < 0) {
    const t = (ny - cy) / dy
    const x = cx + dx * t
    if (x >= nx && x <= nx + nw) candidates.push({ x, y: ny, t })
  }

  if (candidates.length === 0) return { x: cx, y: cy }
  candidates.sort((a, b) => a.t - b.t)
  return { x: candidates[0].x, y: candidates[0].y }
}

export function borderToPosition(bp: { x: number; y: number }, nx: number, ny: number, nw: number, nh: number): Position {
  const eps = 1
  if (Math.abs(bp.x - nx) < eps) return Position.Left
  if (Math.abs(bp.x - (nx + nw)) < eps) return Position.Right
  if (Math.abs(bp.y - ny) < eps) return Position.Top
  if (Math.abs(bp.y - (ny + nh)) < eps) return Position.Bottom
  const cx = nx + nw / 2
  const cy = ny + nh / 2
  if (bp.x >= cx && bp.y >= cy) return Position.Bottom
  if (bp.x >= cx) return Position.Right
  if (bp.y >= cy) return Position.Bottom
  return Position.Top
}

export function multiplicityOffset(
  bp: { x: number; y: number },
  nx: number, ny: number, nw: number, nh: number
): { x: number; y: number } {
  const eps = 1
  if (Math.abs(bp.x - nx) < eps) return { x: -52, y: -11 }
  if (Math.abs(bp.x - (nx + nw)) < eps) return { x: 12, y: -11 }
  if (Math.abs(bp.y - ny) < eps) return { x: -30, y: -34 }
  if (Math.abs(bp.y - (ny + nh)) < eps) return { x: -30, y: 12 }
  return { x: 12, y: -11 }
}

export function diamondOffset(
  bp: { x: number; y: number },
  nx: number, ny: number, nw: number, nh: number,
  size: number
): { dx: number; dy: number; orient: 'h' | 'v' } {
  const eps = 1
  if (Math.abs(bp.x - nx) < eps) return { dx: -size - 6, dy: 0, orient: 'h' }
  if (Math.abs(bp.x - (nx + nw)) < eps) return { dx: -6, dy: 0, orient: 'h' }
  if (Math.abs(bp.y - ny) < eps) return { dx: 0, dy: -size - 6, orient: 'v' }
  if (Math.abs(bp.y - (ny + nh)) < eps) return { dx: 0, dy: -6, orient: 'v' }
  return { dx: -6, dy: 0, orient: 'h' }
}

export function sanitizeLabel(label: string | null | undefined): string | null {
  if (label === null || label === undefined) return null
  const trimmed = label.trim().slice(0, 100)
  return trimmed || null
}
