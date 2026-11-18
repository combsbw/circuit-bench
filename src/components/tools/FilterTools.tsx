import { useMemo, useState } from 'react'
import {
  formatFrequency,
  rcCutoffHz,
  rlCutoffHz,
  seriesRlcResonanceHz,
  seriesRlcQ,
  twinTNotchHz,
} from '../../solver/formulas'
import { formatForKind } from '../../utils/values'
import { SliderField } from './SliderField'

type FilterToolsProps = {
  variant: 'rc' | 'rl' | 'rlc' | 'notch'
  prefill?: Record<string, number | undefined>
  onApply?: (updates: Record<string, string>) => void
  canApply: boolean
}

export function FilterTools({
  variant,
  prefill,
  onApply,
  canApply,
}: FilterToolsProps) {
  const [r, setR] = useState(prefill?.R ?? 1000)
  const [c, setC] = useState(prefill?.C ?? 100e-9)
  const [l, setL] = useState(prefill?.L ?? 10e-3)

  const summary = useMemo(() => {
    switch (variant) {
      case 'rc':
        return `f_c ≈ ${formatFrequency(rcCutoffHz(r, c))} (LP)`
      case 'rl':
        return `f_c ≈ ${formatFrequency(rlCutoffHz(r, l))} (LP)`
      case 'rlc': {
        const f0 = seriesRlcResonanceHz(l, c)
        const q = seriesRlcQ(r, l, c)
        return `f_0 ≈ ${formatFrequency(f0)}, Q ≈ ${q.toFixed(2)}`
      }
      case 'notch': {
        const fn = twinTNotchHz(r, c, l)
        return `f_notch ≈ ${formatFrequency(fn)}`
      }
      default:
        return ''
    }
  }, [variant, r, c, l])

  const title =
    variant === 'rc'
      ? 'RC filter'
      : variant === 'rl'
        ? 'RL filter'
        : variant === 'rlc'
          ? 'Series RLC'
          : 'Twin-T notch'

  return (
    <section className="tool-panel">
      <h3 className="tool-panel__title">{title}</h3>
      <SliderField
        label="R"
        unit="Ω"
        min={10}
        max={100000}
        step={10}
        value={r}
        onChange={setR}
      />
      {(variant === 'rc' || variant === 'rlc' || variant === 'notch') && (
        <SliderField
          label="C"
          unit="F"
          min={1e-12}
          max={1e-4}
          step={1e-10}
          value={c}
          onChange={setC}
        />
      )}
      {(variant === 'rl' || variant === 'rlc' || variant === 'notch') && (
        <SliderField
          label="L"
          unit="H"
          min={1e-6}
          max={1}
          step={1e-5}
          value={l}
          onChange={setL}
        />
      )}
      <p className="tool-panel__result">{summary}</p>
      {canApply && onApply ? (
        <button
          type="button"
          className="tool-panel__apply"
          onClick={() =>
            onApply({
              R: formatForKind('resistor', r),
              ...(variant !== 'rl'
                ? { C: formatForKind('capacitor', c) }
                : {}),
              ...(variant !== 'rc'
                ? { L: formatForKind('inductor', l) }
                : {}),
            })
          }
        >
          Apply to selection
        </button>
      ) : null}
    </section>
  )
}