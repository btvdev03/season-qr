import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { ScanGuideModal } from './components/ScanGuideModal'
import { DeployGuideModal } from './components/DeployGuideModal'
import type { SeasonKey, StyleKey, ViewMode } from './types'
import { resolveSeason, SEASONS } from './utils/seasonUtils'
import { SceneManager } from './engine/SceneManager'
import { MousePointer, ShieldCheck, Eye, Maximize2 } from 'lucide-react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  // App State
  const [url, setUrl] = useState<string>('https://github.com')
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>('auto')
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('tree')
  const [viewMode, setViewMode] = useState<ViewMode>('isometric')
  const [autoRotate, setAutoRotate] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Modals
  const [isScanGuideOpen, setIsScanGuideOpen] = useState<boolean>(false)
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState<boolean>(false)

  // Calculate actual season (handles 'auto' based on current month)
  const actualSeason = resolveSeason(selectedSeason)
  const currentSeasonTheme = SEASONS.find((s) => s.id === actualSeason) || SEASONS[1]

  // Initialize Three.js SceneManager once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const manager = new SceneManager({
      container: containerRef.current,
      initialUrl: url,
      initialSeason: actualSeason,
      initialStyle: selectedStyle,
      autoRotate: autoRotate,
    })

    sceneManagerRef.current = manager

    return () => {
      manager.dispose()
      sceneManagerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync QR URL, Season, and Style changes with the 3D scene
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateScene(url, actualSeason, selectedStyle)
    }
  }, [url, actualSeason, selectedStyle])

  // Sync ViewMode changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setViewMode(viewMode, true)
    }
  }, [viewMode])

  // Sync Auto-rotate changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAutoRotate(autoRotate)
    }
  }, [autoRotate])

  // Reset camera handler
  const handleResetCamera = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetCamera()
    }
  }

  // HD Screenshot Export handler with confetti
  const handleExport = async (mode: 'current' | 'topDown') => {
    if (!sceneManagerRef.current || isExporting) return

    setIsExporting(true)
    try {
      // 1. Capture HD snapshot (1920x1920)
      const dataUrl = await sceneManagerRef.current.exportSnapshot({
        width: 1920,
        height: 1920,
        topDown: mode === 'topDown',
      })

      // 2. Trigger automatic download
      const downloadLink = document.createElement('a')
      const sanitizedFilename = `SeasonQR-${actualSeason}-${selectedStyle}-${Date.now()}.png`
      downloadLink.download = sanitizedFilename
      downloadLink.href = dataUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      // 3. Celebratory Confetti Burst
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: [
          currentSeasonTheme.color,
          '#6366f1',
          '#38bdf8',
          '#ec4899',
          '#f59e0b',
          '#10b981',
        ],
      })
    } catch (error) {
      console.error('Failed to export snapshot:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#090d16] select-none font-sans">
      {/* 1. Header with Seasonal Badge and Action Modals */}
      <Header
        currentSeason={actualSeason}
        onOpenScanGuide={() => setIsScanGuideOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* 2. WebGL 3D Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
        title="Kéo chuột để xoay góc 3D, lăn chuột để phóng to / thu nhỏ"
      />

      {/* 3. Bottom-Left Information & Interaction Badges */}
      <div className="fixed bottom-4 left-4 z-20 hidden lg:flex flex-col gap-2 pointer-events-none">
        {/* Interaction hints */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-[11px] text-slate-300 pointer-events-auto shadow-lg">
          <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
          <span>Chuột trái: <strong>Xoay 3D</strong></span>
          <span className="text-slate-600">•</span>
          <span>Chuột phải: <strong>Di chuyển</strong></span>
          <span className="text-slate-600">•</span>
          <span>Cuộn chuột: <strong>Zoom</strong></span>
        </div>

        {/* Level H Safety Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-[11px] text-emerald-300 pointer-events-auto shadow-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            QR Error Correction <strong>Level H (30%)</strong> • Quét chuẩn 100%
          </span>
        </div>
      </div>

      {/* 4. Quick ViewMode Floating Pill (Mobile / Tablet bottom center) */}
      <div className="fixed bottom-20 left-4 z-20 md:hidden pointer-events-auto">
        <button
          onClick={() => setViewMode(viewMode === 'isometric' ? 'topDown' : 'isometric')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-xs font-semibold text-white shadow-xl"
        >
          {viewMode === 'isometric' ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Góc Quét 90°</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Góc 3D</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Control Panel Sidebar */}
      <ControlPanel
        url={url}
        setUrl={setUrl}
        season={selectedSeason}
        setSeason={setSelectedSeason}
        style={selectedStyle}
        setStyle={setSelectedStyle}
        viewMode={viewMode}
        setViewMode={setViewMode}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        onResetCamera={handleResetCamera}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* 6. Scan Guide Modal */}
      <ScanGuideModal
        isOpen={isScanGuideOpen}
        onClose={() => setIsScanGuideOpen(false)}
        onSwitchToTopDown={() => setViewMode('topDown')}
      />

      {/* 7. GitHub Pages Deploy Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </main>
  )
}
