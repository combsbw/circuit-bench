# Analysis & measure — what works (MVP)

Circuit Bench does **not** run full SPICE. This pass adds **graph-aware** stubs and closed-form tools.

## In-circuit

- **Probes A/B** on canvas nodes → equivalent **DC resistance** between electrical nets (resistors only; C/L open at DC).
- **Multi-select / region drag** in Measure mode → pattern detection (divider, RC/RL, series RLC, twin-T notch heuristic).
- Confidence labels: `exact`, `approximate`, `unsupported`.

## DC resistance limits

- Resistive subgraph between probes; stamp + solve up to **24** resistors.
- Bridges within that limit are supported; disjoint graphs return unsupported.
- Voltage sources are not folded into full nodal solve yet — divider **voltage** uses a simple two-R + one-source template.

## Tool panels

Sliders + numeric fields; **Apply to selection** when the active calculator matches a detected pattern.

## Next

Modified nodal DC (all sources), complex impedance AC sweep, Bode UI — see project `architecture.md` in the Agent Store.