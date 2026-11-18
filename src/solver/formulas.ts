/** Parse human-entered component values (Ω, F, H, V) into SI base units. */
export function parseResistance(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const s = raw.trim().replace(/Ω|ohm|ohms/gi, '').replace(/\s/g, '')
  return parseScaled(s, 'Ω')
}

export function parseCapacitance(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const s = raw.trim().replace(/farad|farads/gi, 'F').replace(/\s/g, '')
  return parseScaled(s, 'F')
}

export function parseInductance(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const s = raw.trim().replace(/henry|henries/gi, 'H').replace(/\s/g, '')
  return parseScaled(s, 'H')
}

export function parseVoltage(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const s = raw.trim().replace(/volt|volts/gi, 'V').replace(/\s/g, '')
  return parseScaled(s, 'V')
}

const PREFIX: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  m: 1e-3,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
}

function parseScaled(s: string, unitLetter: string): number | null {
  const re = new RegExp(
    `^([+-]?\\d*\\.?\\d+)\\s*([pnumkKMµG])?\\s*${unitLetter}?$`,
    'i',
  )
  const bare = new RegExp(`^([+-]?\\d*\\.?\\d+)\\s*${unitLetter}?$`, 'i')
  let m = s.match(re)
  if (!m) m = s.match(bare)
  if (!m) {
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  const base = Number(m[1])
  if (!Number.isFinite(base)) return null
  const pre = m[2] ? (PREFIX[m[2]] ?? 1) : 1
  return base * pre
}

export function formatCapacitance(farads: number): string {
  if (farads >= 1e-3) return `${(farads * 1e3).toFixed(2)} mF`
  if (farads >= 1e-6) return `${(farads * 1e6).toFixed(2)} µF`
  if (farads >= 1e-9) return `${(farads * 1e9).toFixed(2)} nF`
  if (farads >= 1e-12) return `${(farads * 1e12).toFixed(2)} pF`
  return `${farads.toExponential(2)} F`
}

export function formatInductance(henries: number): string {
  if (henries >= 1) return `${henries.toFixed(2)} H`
  if (henries >= 1e-3) return `${(henries * 1e3).toFixed(2)} mH`
  if (henries >= 1e-6) return `${(henries * 1e6).toFixed(2)} µH`
  return `${henries.toExponential(2)} H`
}

export function formatResistance(ohms: number): string {
  if (ohms >= 1e6) return `${(ohms / 1e6).toFixed(2)} MΩ`
  if (ohms >= 1e3) return `${(ohms / 1e3).toFixed(2)} kΩ`
  if (ohms < 1) return `${(ohms * 1e3).toFixed(2)} mΩ`
  return `${ohms.toFixed(2)} Ω`
}

export function formatFrequency(hz: number): string {
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`
  return `${hz.toFixed(2)} Hz`
}

/** V_out = V_in * R2 / (R1 + R2); solve any one unknown when others set. */
export function voltageDivider(
  vIn: number,
  r1: number,
  r2: number,
): { vOut: number } {
  return { vOut: (vIn * r2) / (r1 + r2) }
}

export function rcCutoffHz(r: number, c: number): number {
  return 1 / (2 * Math.PI * r * c)
}

export function rlCutoffHz(r: number, l: number): number {
  return r / (2 * Math.PI * l)
}

export function seriesRlcResonanceHz(l: number, c: number): number {
  return 1 / (2 * Math.PI * Math.sqrt(l * c))
}

export function seriesRlcQ(r: number, l: number, c: number): number {
  return (1 / r) * Math.sqrt(l / c)
}

/** Classic twin-T notch: R-C-R and R-L-R legs; approximate f_notch. */
export function twinTNotchHz(r: number, c: number, l: number): number {
  const fRc = rcCutoffHz(r, c)
  const fRl = rlCutoffHz(r, l)
  return Math.sqrt(fRc * fRl)
}