import { useState } from 'react'
import { Scene } from './components/Scene'
import { Overlay } from './components/Overlay'
import { SolarProvider } from './state/SolarContext'

export default function App() {
  const [activeTool, setActiveTool] = useState('shade')

  return (
    <SolarProvider>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Scene />
        <Overlay activeTool={activeTool} onToolChange={setActiveTool} />
      </div>
    </SolarProvider>
  )
}
