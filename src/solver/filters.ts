import type { DetectedPattern, PatternKind } from './patterns'
import {
  formatFrequency,
  rcCutoffHz,
  rlCutoffHz,
  seriesRlcResonanceHz,
  seriesRlcQ,
  twinTNotchHz,
} from './formulas'

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'unknown'

export interface FilterInsight {
  filterType: FilterType
  cutoffHz: number | null
  resonanceHz: number | null
  q: number | null
  summary: string
}

export function insightFromPattern(pattern: DetectedPattern): FilterInsight {
  const { kind, slots } = pattern

  switch (kind as PatternKind) {
    case 'rc_lowpass': {
      const r = slots.R
      const c = slots.C
      if (r && c) {
        const fc = rcCutoffHz(r, c)
        return {
          filterType: 'lowpass',
          cutoffHz: fc,
          resonanceHz: null,
          q: null,
          summary: `RC low-pass, f_c ≈ ${formatFrequency(fc)}`,
        }
      }
      break
    }
    case 'rl_lowpass': {
      const r = slots.R
      const l = slots.L
      if (r && l) {
        const fc = rlCutoffHz(r, l)
        return {
          filterType: 'lowpass',
          cutoffHz: fc,
          resonanceHz: null,
          q: null,
          summary: `RL low-pass, f_c ≈ ${formatFrequency(fc)}`,
        }
      }
      break
    }
    case 'series_rlc': {
      const r = slots.R
      const l = slots.L
      const c = slots.C
      if (r && l && c) {
        const f0 = seriesRlcResonanceHz(l, c)
        const q = seriesRlcQ(r, l, c)
        return {
          filterType: 'bandpass',
          cutoffHz: null,
          resonanceHz: f0,
          q,
          summary: `Series RLC resonance f_0 ≈ ${formatFrequency(f0)}, Q ≈ ${q.toFixed(2)}`,
        }
      }
      break
    }
    case 'twin_t_notch': {
      const r = slots.R
      const c = slots.C
      const l = slots.L
      if (r && c && l) {
        const fn = twinTNotchHz(r, c, l)
        return {
          filterType: 'notch',
          cutoffHz: fn,
          resonanceHz: fn,
          q: null,
          summary: `Notch (twin-T heuristic) f_notch ≈ ${formatFrequency(fn)}`,
        }
      }
      break
    }
    case 'voltage_divider':
      return {
        filterType: 'unknown',
        cutoffHz: null,
        resonanceHz: null,
        q: null,
        summary: 'Voltage divider — no AC filter pole.',
      }
    default:
      break
  }

  return {
    filterType: 'unknown',
    cutoffHz: null,
    resonanceHz: null,
    q: null,
    summary: 'No filter classification for this selection.',
  }
}