import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { ScanGuideModal } from './components/ScanGuideModal'
import { DeployGuideModal } from './components/DeployGuideModal'
import type { SeasonKey, StyleKey, ViewMode } from './types'
import { resolveSeason } from './utils/seasonUtils'
import { SceneManager } from './engine/SceneManager'
import {
  Sparkles,
  RotateCcw,
  Upload,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  HelpCircle,
  Download,
} from 'lucide-react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  // Core App State matching ICQR
  const [url, setUrl] = useState<string>('https://icqr.com/')
  const [inputUrl, setInputUrl] = useState<string>('https://icqr.com/')
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>('summer')
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('tree')
  const [viewMode, setViewMode] = useState<ViewMode>('isometric')
  const [autoRotate, setAutoRotate] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false)

  // Modals
  const [isScanGuideOpen, setIsScanGuideOpen] = useState<boolean>(false)
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState<boolean>(false)

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

  // URL Submit handler
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputUrl.trim()
    if (trimmed && trimmed !== url) {
      setUrl(trimmed)
    }
  }

  // HD Snapshot Export handler
  const handleExport = async (topDown: boolean = false) => {
    if (!sceneManagerRef.current || isExporting) return

    setIsExporting(true)
    try {
      const dataUrl = await sceneManagerRef.current.exportSnapshot({
        width: 1920,
        height: 1920,
        topDown: topDown,
      })

      const downloadLink = document.createElement('a')
      downloadLink.download = `SeasonQR-${actualSeason}-${Date.now()}.png`
      downloadLink.href = dataUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22c55e', '#a3e635', '#facc15'],
      })
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none font-sans bg-[#f6f1e7] text-stone-800">
      {/* 1. MINIMAL TOP BAR */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
        {/* Brand */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            🌳
          </div>
          <span className="font-bold text-stone-800 text-lg tracking-tight">SeasonQR</span>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsScanGuideOpen(true)}
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-sm transition-all"
            title="Mẹo quét mã QR"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeployGuideOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-sm text-xs font-medium transition-all"
            title="Hướng dẫn Deploy GitHub Pages miễn phí"
          >
            <span>Deploy Free</span>
          </button>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-sm transition-all"
            title="Cài đặt & Phong cách khác"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-white/70 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-sm transition-all"
            title="Mã nguồn GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>

      {/* 2. THREE.JS 3D VIEWPORT CONTAINER */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
        title="Chạm vào cây để xem mã QR • Kéo chuột để xoay 3D"
      />

      {/* 3. SIGNATURE CENTER FLOATING PILL BUTTON (Matching ICQR Image 1 & 2!) */}
      <div className="fixed bottom-36 md:bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={() => setViewMode(viewMode === 'isometric' ? 'topDown' : 'isometric')}
          className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md hover:shadow-lg border border-stone-300/60 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-medium"
        >
          {viewMode === 'isometric' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Tap the tree to see QR code</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
              <span>Tap to see the tree</span>
            </>
          )}
        </button>
      </div>

      {/* 4. SIGNATURE MINIMAL BOTTOM BAR (Matching ICQR Image 1!) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-auto flex flex-col items-center gap-3">
        {/* Row 1: URL Input Card */}
        <form
          onSubmit={handleUrlSubmit}
          className="w-full flex items-center bg-white rounded-2xl shadow-md border border-stone-200/80 p-1.5 transition-all focus-within:shadow-lg focus-within:border-stone-300"
        >
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onBlur={() => handleUrlSubmit()}
            placeholder="Type any link (e.g. https://...)"
            className="flex-1 px-4 py-2 text-sm text-stone-800 bg-transparent outline-none placeholder:text-stone-400 font-medium"
          />
          <button
            type="submit"
            onClick={() => handleExport(viewMode === 'topDown')}
            disabled={isExporting}
            className="p-2.5 rounded-xl bg-[#b46b43] hover:bg-[#a05a33] text-white shadow-sm transition-all active:scale-95 flex items-center justify-center"
            title="Tải ảnh QR (HD)"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Row 2: Season Selector Pills (Matching ICQR Image 1!) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-200/60 backdrop-blur-sm border border-stone-300/40 text-xs font-medium text-stone-600">
          <button
            onClick={() => setSelectedSeason('spring')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'spring'
                ? 'bg-[#e8dfce] text-stone-900 shadow-sm font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            <span>🌸</span>
            <span>Spring</span>
          </button>

          <button
            onClick={() => setSelectedSeason('summer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'summer'
                ? 'bg-[#e8dfce] text-stone-900 shadow-sm font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            <span>☀️</span>
            <span>Summer</span>
          </button>

          <button
            onClick={() => setSelectedSeason('autumn')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'autumn'
                ? 'bg-[#e8dfce] text-stone-900 shadow-sm font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            <span>🍁</span>
            <span>Autumn</span>
          </button>

          <button
            onClick={() => setSelectedSeason('winter')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'winter'
                ? 'bg-[#e8dfce] text-stone-900 shadow-sm font-semibold'
                : 'hover:text-stone-900'
            }`}
          >
            <span>❄️</span>
            <span>Winter</span>
          </button>

          {/* Sound / Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 ml-0.5 rounded-lg text-stone-500 hover:text-stone-800 transition-colors"
            title={isMuted ? 'Bật âm thanh thiên nhiên' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 5. SLIDE-OVER SETTINGS DRAWER (Discreet & Out of the Way) */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-xs">
          <div
            className="absolute inset-0"
            onClick={() => setShowSettingsDrawer(false)}
          />
          <div className="relative w-full max-w-xs h-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 border-l border-stone-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="font-bold text-stone-800 text-sm">Cài Đặt & Kiểu Dáng</h3>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  ✕
                </button>
              </div>

              {/* Style Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-600">Phong cách 3D:</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setSelectedStyle('tree')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === 'tree'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-xl">🌳</span>
                    <div>
                      <div className="text-xs font-bold">Cây Biến Hình (ICQR Tree)</div>
                      <div className="text-[10px] text-stone-500">Lá cây bay xếp thành mã QR nghệ thuật</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedStyle('island')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === 'island'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-xl">🏝️</span>
                    <div>
                      <div className="text-xs font-bold">Đảo Voxel Bồng Bềnh</div>
                      <div className="text-[10px] text-stone-500">Đảo bay lơ lửng với nhũ đá bên dưới</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedStyle('zen')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === 'zen'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-xl">⛩️</span>
                    <div>
                      <div className="text-xs font-bold">Vườn Đá Zen</div>
                      <div className="text-[10px] text-stone-500">Đèn đá Toro và cổng Torii Nhật Bản</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Extra Toggles */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <label className="flex items-center justify-between text-xs text-stone-700 cursor-pointer">
                  <span>Xoay tự động (Auto-Rotate):</span>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <button
                  onClick={() => handleExport(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải ảnh 3D Isometric (HD)</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 text-[11px] text-stone-500 text-center">
              SeasonQR • 100% Client-side & Free
            </div>
          </div>
        </div>
      )}

      {/* 6. Modals */}
      <ScanGuideModal
        isOpen={isScanGuideOpen}
        onClose={() => setIsScanGuideOpen(false)}
        onSwitchToTopDown={() => setViewMode('topDown')}
      />

      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </main>
  )
}
