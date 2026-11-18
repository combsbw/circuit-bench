import { useMemo, useState } from 'react'
import { voltageDivider } from '../../solver/formulas'
import { formatForKind } from '../../utils/values'
import { SliderField } from './SliderField'

type VoltageDividerToolProps = {
  prefill?: { R1?: number; R2?: number; V_in?: number }
  onApply?: (values: { r1: string; r2: string; vIn: string }) => void
  canApply: boolean
}

export function VoltageDividerTool({
  prefill,
  onApply,
  canApply,
}: VoltageDividerToolProps) {
  const [vIn, setVIn] = useState(prefill?.V_in ?? 5)
  const [r1, setR1] = useState(prefill?.R1 ?? 10000)
  const [r2, setR2] = useState(prefill?.R2 ?? 10000)

  const vOut = useMemo(
    () => voltageDivider(vIn, r1, r2).vOut,
    [vIn, r1, r2],
  )

  return (
    <section className="tool-panel">
      <h3 className="tool-panel__title">Voltage divider</h3>
      <p className="tool-panel__hint">
        Slider + numeric entry. Prefill when two series R are selected.
      </p>
      <SliderField
        label="V_in"
        unit="V"
        min={0}
        max={24}
        step={0.1}
        value={vIn}
        onChange={setVIn}
      />
      <SliderField
        label="R1"
        unit="Ω"
        min={10}
        max={100000}
        step={10}
        value={r1}
        onChange={setR1}
      />
      <SliderField
        label="R2"
        unit="Ω"
        min={10}
        max={100000}
        step={10}
        value={r2}
        onChange={setR2}
      />
      <p className="tool-panel__result">
        V_out ≈ <strong>{vOut.toFixed(3)} V</strong>
      </p>
      {canApply && onApply ? (
        <button
          type="button"
          className="tool-panel__apply"
          onClick={() =>
            onApply({
              r1: formatForKind('resistor', r1),
              r2: formatForKind('resistor', r2),
              vIn: `${vIn} V`,
            })
          }
        >
          Apply to selection
        </button>
      ) : null}
    </section>
  )
}