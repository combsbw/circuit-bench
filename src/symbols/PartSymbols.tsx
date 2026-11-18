import type { ReactElement } from 'react'
import type { PartKind } from '../types/circuit'

const stroke = 'currentColor'
const sw = 1.6

type SymbolProps = { className?: string }

export function ResistorSymbol({ className }: SymbolProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 24"
      width={56}
      height={24}
      aria-hidden
    >
      <path
        d="M4 12 H12 L15 6 L21 18 L27 6 L33 18 L39 6 L44 12 H52"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CapacitorSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 48 24" width={48} height={24} aria-hidden>
      <path d="M4 12 H20" stroke={stroke} strokeWidth={sw} />
      <path d="M28 12 H44" stroke={stroke} strokeWidth={sw} />
      <line x1="20" y1="4" x2="20" y2="20" stroke={stroke} strokeWidth={sw + 0.4} />
      <line x1="28" y1="4" x2="28" y2="20" stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

export function InductorSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 52 24" width={52} height={24} aria-hidden>
      <path
        d="M4 12 H10 a6 6 0 0 1 0 0 M16 12 a6 6 0 0 1 0 0 M22 12 a6 6 0 0 1 0 0 M28 12 a6 6 0 0 1 0 0 M34 12 a6 6 0 0 1 0 0 M40 12 H46"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function GroundSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 32 36" width={32} height={36} aria-hidden>
      <path d="M16 4 V14" stroke={stroke} strokeWidth={sw} />
      <path d="M8 14 H24" stroke={stroke} strokeWidth={sw + 0.2} />
      <path d="M10 20 H22" stroke={stroke} strokeWidth={sw} />
      <path d="M12 26 H20" stroke={stroke} strokeWidth={sw - 0.2} />
    </svg>
  )
}

export function VoltageSourceSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" width={40} height={40} aria-hidden>
      <circle cx="20" cy="20" r="14" fill="none" stroke={stroke} strokeWidth={sw} />
      <path d="M20 12 V28 M14 20 H26" stroke={stroke} strokeWidth={sw + 0.2} strokeLinecap="round" />
    </svg>
  )
}

export function OpAmpSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 52 40" width={52} height={40} aria-hidden>
      <path
        d="M12 4 L44 20 L12 36 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path d="M22 14 H26 M22 26 H26" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <text x="16" y="17" fontSize="8" fill={stroke} fontFamily="system-ui">
        +
      </text>
      <text x="16" y="31" fontSize="9" fill={stroke} fontFamily="system-ui">
        −
      </text>
    </svg>
  )
}

export function NpnSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 48 44" width={48} height={44} aria-hidden>
      <circle cx="22" cy="22" r="16" fill="none" stroke={stroke} strokeWidth={sw} />
      <path d="M22 6 V14" stroke={stroke} strokeWidth={sw} />
      <path d="M22 30 V42" stroke={stroke} strokeWidth={sw} />
      <path d="M30 22 H42" stroke={stroke} strokeWidth={sw} />
      <path d="M22 22 L30 18" stroke={stroke} strokeWidth={sw} />
      <path d="M26 30 L30 22 L26 14" fill="none" stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

export function NmosSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 52 44" width={52} height={44} aria-hidden>
      <path d="M8 12 V32" stroke={stroke} strokeWidth={sw + 0.5} />
      <path d="M12 12 V18 M12 26 V32" stroke={stroke} strokeWidth={sw} />
      <path d="M12 20 H28 M12 24 H28" stroke={stroke} strokeWidth={sw} />
      <path d="M28 12 V32" stroke={stroke} strokeWidth={sw} />
      <path d="M28 16 H40" stroke={stroke} strokeWidth={sw} />
      <path d="M28 28 H40" stroke={stroke} strokeWidth={sw} />
      <path d="M40 12 V20 M40 28 V36" stroke={stroke} strokeWidth={sw} />
      <path d="M18 4 V12" stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

export function PmosSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 52 44" width={52} height={44} aria-hidden>
      <circle cx="16" cy="22" r="3" fill="none" stroke={stroke} strokeWidth={sw - 0.4} />
      <path d="M8 12 V32" stroke={stroke} strokeWidth={sw + 0.5} />
      <path d="M12 12 V18 M12 26 V32" stroke={stroke} strokeWidth={sw} />
      <path d="M12 20 H28 M12 24 H28" stroke={stroke} strokeWidth={sw} />
      <path d="M28 12 V32" stroke={stroke} strokeWidth={sw} />
      <path d="M28 16 H40" stroke={stroke} strokeWidth={sw} />
      <path d="M28 28 H40" stroke={stroke} strokeWidth={sw} />
      <path d="M40 12 V20 M40 28 V36" stroke={stroke} strokeWidth={sw} />
      <path d="M22 4 V12" stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

export function RegulatorSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 44 36" width={44} height={36} aria-hidden>
      <rect
        x="8"
        y="6"
        width="28"
        height="24"
        rx="3"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      <text x="14" y="22" fontSize="10" fill={stroke} fontFamily="system-ui" fontWeight="600">
        REG
      </text>
    </svg>
  )
}

export function GateDriverSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 48 36" width={48} height={36} aria-hidden>
      <rect
        x="6"
        y="4"
        width="36"
        height="28"
        rx="3"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      <path d="M14 18 H22 M26 18 H34" stroke={stroke} strokeWidth={sw} />
      <path d="M22 14 V22 M26 14 V22" stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

export function ModuleSymbol({ className }: SymbolProps) {
  return (
    <svg className={className} viewBox="0 0 56 40" width={56} height={40} aria-hidden>
      <rect
        x="4"
        y="6"
        width="48"
        height="28"
        rx="4"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      <path d="M12 14 H44 M12 22 H40 M12 30 H36" stroke={stroke} strokeWidth={1.2} opacity={0.7} />
    </svg>
  )
}

const MAP: Record<PartKind, (p: SymbolProps) => ReactElement> = {
  resistor: ResistorSymbol,
  capacitor: CapacitorSymbol,
  inductor: InductorSymbol,
  ground: GroundSymbol,
  voltage_source: VoltageSourceSymbol,
  op_amp: OpAmpSymbol,
  npn: NpnSymbol,
  nmos: NmosSymbol,
  pmos: PmosSymbol,
  regulator: RegulatorSymbol,
  gate_driver: GateDriverSymbol,
  module: ModuleSymbol,
  placeholder: () => <span>?</span>,
}

export function PartSymbol({
  kind,
  className,
  rotation = 0,
}: {
  kind: PartKind
  className?: string
  rotation?: number
}) {
  const Cmp = MAP[kind] ?? MAP.placeholder
  return (
    <div
      className="circuit-node__symbol-wrap"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Cmp className={className} />
    </div>
  )
}