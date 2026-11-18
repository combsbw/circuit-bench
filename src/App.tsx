import { useCallback, useRef } from 'react'
import { CircuitCanvas } from './components/CircuitCanvas'
import { ComponentPalette, type PaletteItem } from './components/ComponentPalette'
import { Toolbar } from './components/Toolbar'
import './App.css'

function App() {
  const addPartRef = useRef<((item: PaletteItem) => void) | null>(null)

  const handleRegisterAdd = useCallback((fn: (item: PaletteItem) => void) => {
    addPartRef.current = fn
  }, [])

  const handleAddFromPalette = useCallback((item: PaletteItem) => {
    addPartRef.current?.(item)
  }, [])

  return (
    <div className="app">
      <Toolbar mode="design" />
      <main className="app__main">
        <ComponentPalette onAddPart={handleAddFromPalette} />
        <CircuitCanvas onRegisterAdd={handleRegisterAdd} />
      </main>
    </div>
  )
}

export default App