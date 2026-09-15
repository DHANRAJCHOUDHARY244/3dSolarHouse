import styles from './Overlay.module.css'
import { SITE, formatClock } from '../lib/site'
import { useSolar } from '../state/SolarContext'
import type { PlaybackSpeed } from '../lib/solar'

const TOOLS = [
  { id: 'select', label: 'Select', icon: SelectIcon },
  { id: 'pan', label: 'Pan', icon: PanIcon },
  { id: 'measure', label: 'Measure', icon: MeasureIcon },
  { id: 'panel', label: 'Add panels', icon: PanelIcon },
  { id: 'shade', label: 'Shade study', icon: ShadeIcon },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
]

type Props = {
  activeTool: string
  onToolChange: (id: string) => void
}

export function Overlay({ activeTool, onToolChange }: Props) {
  const solar = useSolar()
  const {
    selectedHours,
    setHours,
    day,
    isPlaying,
    togglePlay,
    resetToSunrise,
    playbackSpeed,
    setPlaybackSpeed,
    speeds,
    dateInput,
    setDateInput,
    solar: pos,
    isNight,
    batterySoc,
    powerMode,
    setPlaying,
  } = solar

  const lo = day.sunriseHours - 1.2
  const hi = day.sunsetHours + 2.2

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <img
            className={styles.logoImg}
            src="/soms-energy-logo.png"
            alt="SOM'S ENERGY"
          />
          <div>
            <div className={styles.brandName}>SOM&apos;S ENERGY</div>
            <div className={styles.brandSub}>The Smart Choice · {SITE.label}</div>
          </div>
        </div>
        <div className={styles.badges}>
          <label className={styles.dateField}>
            <span>Date</span>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => {
                setPlaying(false)
                setDateInput(e.target.value)
              }}
            />
          </label>
          <span className={styles.badge}>{isNight ? 'Night · battery' : 'Day · solar'}</span>
          <span className={styles.badgeAccent}>{formatClock(selectedHours)}</span>
        </div>
      </header>

      <aside className={styles.toolbar}>
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              className={`${styles.toolBtn} ${activeTool === t.id ? styles.toolActive : ''}`}
              title={t.label}
              onClick={() => onToolChange(t.id)}
            >
              <Icon />
            </button>
          )
        })}
      </aside>

      <aside className={styles.infoPanel}>
        <div className={styles.infoTitle}>Solar position</div>
        <dl className={styles.infoGrid}>
          <div>
            <dt>Time</dt>
            <dd>{formatClock(selectedHours)}</dd>
          </div>
          <div>
            <dt>Azimuth</dt>
            <dd>{pos.azimuthDegNorth.toFixed(0)}°</dd>
          </div>
          <div>
            <dt>Altitude</dt>
            <dd>{pos.altitudeDeg.toFixed(1)}°</dd>
          </div>
          <div>
            <dt>Sunrise</dt>
            <dd>{formatClock(day.sunriseHours)}</dd>
          </div>
          <div>
            <dt>Solar noon</dt>
            <dd>{formatClock(day.solarNoonHours)}</dd>
          </div>
          <div>
            <dt>Sunset</dt>
            <dd>{formatClock(day.sunsetHours)}</dd>
          </div>
        </dl>
        <div className={styles.energyRow}>
          <span>Battery</span>
          <div className={styles.socTrack}>
            <div
              className={styles.socFill}
              style={{
                width: `${batterySoc * 100}%`,
                background:
                  batterySoc > 0.35 ? '#22c55e' : batterySoc > 0.15 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
          <strong>{Math.round(batterySoc * 100)}%</strong>
        </div>
        <div className={styles.powerMode}>
          {powerMode === 'solar' && 'Panels charging battery'}
          {powerMode === 'battery' && 'Battery supplying house'}
          {powerMode === 'idle' && 'Low irradiance · standby'}
        </div>
      </aside>

      <div className={styles.compass}>
        <div className={styles.compassRing}>
          <span className={styles.compassN}>N</span>
          <span className={styles.compassE}>E</span>
          <span className={styles.compassS}>S</span>
          <span className={styles.compassW}>W</span>
          <span
            className={styles.compassSun}
            style={{ transform: `rotate(${pos.azimuthDegNorth}deg)` }}
            title={`Sun az ${pos.azimuthDegNorth.toFixed(0)}°`}
          />
        </div>
      </div>

      <div className={styles.dayMeta}>
        <div>
          <span>Sunrise</span>
          <strong>{formatClock(day.sunriseHours)}</strong>
        </div>
        <div>
          <span>Noon</span>
          <strong>{formatClock(day.solarNoonHours)}</strong>
        </div>
        <div>
          <span>Sunset</span>
          <strong>{formatClock(day.sunsetHours)}</strong>
        </div>
      </div>

      <footer className={styles.timeline}>
        <button type="button" className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" className={styles.resetBtn} onClick={resetToSunrise} title="Reset to sunrise">
          <ResetIcon />
        </button>
        <div className={styles.sliderWrap}>
          <div className={styles.timeEnds}>
            <span>{formatClock(lo)}</span>
            <span className={styles.nowLabel}>{isNight ? 'Moon · night' : 'Sun path'}</span>
            <span>{formatClock(hi)}</span>
          </div>
          <input
            type="range"
            min={lo}
            max={hi}
            step={0.01}
            value={selectedHours}
            onChange={(e) => {
              setPlaying(false)
              setHours(Number(e.target.value))
            }}
          />
        </div>
        <div className={styles.speedGroup}>
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              className={playbackSpeed === s ? styles.speedActive : styles.speedBtn}
              onClick={() => setPlaybackSpeed(s as PlaybackSpeed)}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className={styles.timeReadout}>{formatClock(selectedHours)}</div>
      </footer>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5v11l10-5.5L4 2.5z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="3.5" height="12" rx="1" />
      <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
    </svg>
  )
}
function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SelectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4l7 16 2.5-6.5L20 11 4 4z" />
    </svg>
  )
}
function PanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18M3 12h18M7 7l-4 5 4 5M17 7l4 5-4 5M7 17l5 4 5-4M7 7l5-4 5 4" />
    </svg>
  )
}
function MeasureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20L20 3M7 20h.01M11 20h.01M15 20h.01M19 20h.01M19 16h.01M19 12h.01" />
    </svg>
  )
}
function PanelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 12h18M12 5v14M7.5 5v14M16.5 5v14" />
    </svg>
  )
}
function ShadeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M5 19l1.5-1.5" />
    </svg>
  )
}
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  )
}
