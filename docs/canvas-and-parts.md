# Canvas editor, symbols, and parts catalog

## Canvas (RAM-2)

- **Delete / Backspace** removes selected nodes and edges (Design and Build modes).
- **Shift+click** multi-selects nodes; **Shift+drag** marquee-selects when not in Measure mode.
- **Undo / redo** via toolbar buttons or ⌘/Ctrl+Z and ⌘/Ctrl+Shift+Z (or Ctrl+Y).
- Snap-to-grid (16 px) remains enabled for touch-friendly placement.

## Symbols (RAM-3)

Passive and source nodes render IEEE-style SVG silhouettes (R, C, L, GND, DC source). Semiconductors include op-amp triangle, NPN, N/P-MOSFET, regulator, and gate-driver blocks. Rotation is adjustable in the inspector (90° steps).

## Parts bank (RAM-4)

`src/catalog/parts.ts` seeds ESP32-S3 Supermini, TC4420, TL072, LM7812, and 2N7002 with pinout tables. The palette is grouped into Passive, Sources, Semiconductors, and Modules. The inspector drawer edits label, value, MPN, catalog assignment, and rotation; catalog attributes persist in node `data` and in saved `CircuitDocument` JSON.

Placing a catalog module opens the pinout slide-over; it can be reopened from the inspector.

## Build mode (RAM-5 partial)

Unconnected handles are highlighted in amber; wired handles use the accent color. Adding the first wire auto-checks **At least one wire placed** in the build checklist.