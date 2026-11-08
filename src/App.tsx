import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Header } from './components/Header'
import { ControlPanel } from './components/ControlPanel'
import { ScanGuideModal } from './components/ScanGuideModal'
import { DeployGuideModal } from './components/DeployGuideModal'
import type { SeasonKey, StyleKey, ViewMode } from './types'
import { resolveSeason } from './utils/seasonUtils'
import { SceneManager } from './engine/SceneManager'
import { MousePointer, ShieldCheck, Sparkles, RotateCcw, Sun, Moon } from 'lucide-react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  // App State
  const [url, setUrl] = useState<string>('https://icqr.com/')
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>('summer')
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('tree')
  const [viewMode, setViewMode] = useState<ViewMode>('isometric')
  const [autoRotate, setAutoRotate] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [themeMode, setThemeMode] = useState<'cream' | 'dark'>('cream')

  // Modals
  const [isScanGuideOpen, setIsScanGuideOpen] = useState<boolean>(false)
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState<boolean>(false)

  // Calculate actual season
  const actualSeason = resolveSeason(selectedSeason)

  // Initialize Three.js SceneManager once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const manager = new SceneManager({
      container: containerRef.current,
      initialUrl: url,
      initialSeason: actualSeason,
      initialStyle: selectedStyle,
      autoRotate: autoRotate,
      onViewModeChange: (newMode) => {
        setViewMode(newMode)
      },
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
      const dataUrl = await sceneManagerRef.current.exportSnapshot({
        width: 1920,
        height: 1920,
        topDown: mode === 'topDown',
      })

      const downloadLink = document.createElement('a')
      const sanitizedFilename = `SeasonQR-${actualSeason}-${selectedStyle}-${Date.now()}.png`
      downloadLink.download = sanitizedFilename
      downloadLink.href = dataUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: actualSeason === 'spring'
          ? ['#ff85a1', '#f72585', '#ffe5ec']
          : actualSeason === 'summer'
          ? ['#27ae60', '#f39c12', '#2ecc71']
          : actualSeason === 'autumn'
          ? ['#d35400', '#f1c40f', '#c0392b']
          : ['#38bdf8', '#ffffff', '#0284c7'],
      })
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const isCream = themeMode === 'cream'

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden select-none font-sans transition-colors duration-500 ${
        isCream ? 'bg-[#f6f1e7] text-slate-800' : 'bg-[#090d16] text-slate-100'
      }`}
    >
      {/* 1. Header with Seasonal Badge and Action Modals */}
      <Header
        currentSeason={actualSeason}
        onOpenScanGuide={() => setIsScanGuideOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* 2. WebGL 3D Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
        title="Chạm vào cây để biến hình thành mã QR • Kéo chuột để xoay 3D"
      />

      {/* 3. SIGNATURE CENTER PILL: Tap the tree to see QR code / Tap to see the tree */}
      <div className="fixed bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={() => setViewMode(viewMode === 'isometric' ? 'topDown' : 'isometric')}
          className={`group flex items-center gap-2 px-6 py-2.5 rounded-full shadow-xl border backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-semibold ${
            isCream
              ? 'bg-white/95 hover:bg-white text-stone-700 border-stone-300/80 shadow-stone-300/50'
              : 'bg-slate-900/90 hover:bg-slate-900 text-white border-white/20 shadow-black/60'
          }`}
        >
          {viewMode === 'isometric' ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Chạm vào cây để xem mã QR (Tap tree to see QR code)</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span>Chạm để xem cây 3D (Tap to see the tree)</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Bottom-Left Information & Interaction Badges */}
      <div className="fixed bottom-4 left-4 z-20 hidden lg:flex flex-col gap-2 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] pointer-events-auto shadow-md border ${
            isCream
              ? 'bg-white/80 border-stone-200 text-stone-600'
              : 'glass-card text-slate-300'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5 text-emerald-500" />
          <span>Click chuột: <strong>Biến hình QR</strong></span>
          <span className="text-stone-300">•</span>
          <span>Kéo chuột: <strong>Xoay 3D</strong></span>
          <span className="text-stone-300">•</span>
          <span>Lăn chuột: <strong>Zoom</strong></span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] pointer-events-auto shadow-md border ${
            isCream
              ? 'bg-white/80 border-stone-200 text-emerald-700'
              : 'glass-card text-emerald-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Lá cây xếp thành <strong>Mã QR Nghệ Thuật</strong> • Quét chuẩn 100%
          </span>
        </div>
      </div>

      {/* 5. Theme Toggle Button (Cream / Dark) */}
      <div className="fixed bottom-4 right-4 z-20 hidden md:flex pointer-events-auto">
        <button
          onClick={() => setThemeMode(isCream ? 'dark' : 'cream')}
          className={`p-2 rounded-xl border shadow-md transition-all ${
            isCream
              ? 'bg-white/90 border-stone-200 text-stone-600 hover:text-stone-900'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title={isCream ? 'Chuyển sang nền tối' : 'Chuyển sang nền kem tự nhiên (ICQR Style)'}
        >
          {isCream ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* 6. Control Panel Sidebar */}
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

      {/* 7. Scan Guide Modal */}
      <ScanGuideModal
        isOpen={isScanGuideOpen}
        onClose={() => setIsScanGuideOpen(false)}
        onSwitchToTopDown={() => setViewMode('topDown')}
      />

      {/* 8. GitHub Pages Deploy Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </main>
  )
}
