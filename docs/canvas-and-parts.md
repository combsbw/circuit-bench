# Canvas editor, symbols, and parts catalog

## Canvas (RAM-2)

- **Delete / Backspace** removes selected nodes and edges (Design and Build modes).
- **Shift+click** multi-selects nodes; **Shift+drag** marquee-selects when not in Measure mode.
- **Undo / redo** via toolbar buttons or ⌘/Ctrl+Z and ⌘/Ctrl+Shift+Z (or Ctrl+Y).
- Snap-to-grid (16 px) remains enabled for touch-friendly placement.

## Symbols (RAM-3)

Passive and source nodes render IEEE-style SVG silhouettes (R, C, L, GND, DC source). Semiconductors include op-amp triangle, NPN, N/P-MOSFET, regulator, and gate-driver blocks. Rotation is adjustable in the inspector (90° steps).

## Parts bank (RAM-4)

`src/catalog/parts.ts` seeds modules (ESP32-S3 Supermini), drivers (TC4420), op-amps (TL072), regulators (LM7812), MOSFETs (2N7002, IRLZ44N, IRFB4410 — search alias `irbf4410`), BJT (2N2222), and diodes (1N4007, 1N4148, LED, Zener, TVS) with pinout tables. The palette is grouped into **Passive** (incl. Coil → inductor, fuse, SPST switch), **Sources**, **Semiconductors**, **Diodes**, and **Modules**. Per-kind inspector fields cover Vf/color (LED), Vz (Zener), Vbr (TVS), and fuse current rating.

Placing a catalog module opens the pinout slide-over; it can be reopened from the inspector.

## Build mode (RAM-5 partial)

Unconnected handles are highlighted in amber; wired handles use the accent color. Adding the first wire auto-checks **At least one wire placed** in the build checklist.