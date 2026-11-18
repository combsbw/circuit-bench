# Analysis & measure — what works (MVP)

Circuit Bench does **not** run full SPICE. This pass adds **graph-aware** stubs and closed-form tools.

## Measure mode (DMM strip)

- **R** — Probes A/B on canvas nodes → equivalent **DC resistance** between electrical nets (resistors; C/L open at DC).
- **V DC** — Probe A vs schematic **ground** (MNA when possible).
- **C** — Probes A/B → equivalent **capacitance** between nets (series/parallel reduction on capacitor subgraph). Shows **L** hint when an inductive path is also reducible.

Calculators (divider, RC/RL/RLC/notch) live under **calculator assist** — they prefill from selection but are not the DMM readout.

## In-circuit pattern detection

- **Multi-select / region drag** in Measure mode → pattern detection (divider, RC/RL, series RLC, twin-T notch heuristic).
- Confidence labels: `exact`, `approximate`, `unsupported`.

## DC limits

- **Resistance:** resistive subgraph between probes; conductance solve up to **24** resistors. Bridges within that limit are supported.
- **Voltage (MNA):** ideal voltage sources + resistors; up to **48** resistors and **8** sources on the conductive network tied to ground. Capacitors and inductors are **open** at DC (probes may read `approximate` when C/L are on the sheet).
- C/L do not participate in the nodal voltage solve yet.

## Troubleshoot mode

- **Open nets** list: terminals with no wire (same rules as build-mode open-handle highlights). Tap a row to pan/zoom to that part.

## Tool panels

Sliders + numeric fields; **Apply to selection** when the active calculator matches a detected pattern.

## Next

Complex impedance AC sweep, Bode UI, sparse MNA AC — see project `architecture.md` in the Agent Store.