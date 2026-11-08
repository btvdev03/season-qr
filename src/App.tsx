import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { ScanGuideModal } from './components/ScanGuideModal'
import { DeployGuideModal } from './components/DeployGuideModal'
import type { SeasonKey, StyleKey, ViewMode } from './types'
import { resolveSeason } from './utils/seasonUtils'
import { SceneManager } from './engine/SceneManager'
import { soundEngine } from './utils/audioAmbiance'
import {
  Sparkles,
  RotateCcw,
  Upload,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  HelpCircle,
  Download,
  ShieldCheck,
} from 'lucide-react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  // Core App State
  const [url, setUrl] = useState<string>('https://icqr.com/')
  const [inputUrl, setInputUrl] = useState<string>('https://icqr.com/')
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>('summer')
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('tree')
  const [viewMode, setViewMode] = useState<ViewMode>('isometric')
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
      autoRotate: false, // Locked camera as requested
      onViewModeChange: (newMode) => {
        setViewMode(newMode)
        soundEngine.playMorphSound(newMode === 'topDown')
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
    soundEngine.setMuted(isMuted, actualSeason)
  }, [url, actualSeason, selectedStyle, isMuted])

  // Sync ViewMode changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setViewMode(viewMode, true)
    }
  }, [viewMode])

  // Sound Mute Toggle
  const toggleSound = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    soundEngine.setMuted(nextMuted, actualSeason)
  }

  // URL Submit handler
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputUrl.trim()
    if (trimmed && trimmed !== url) {
      setUrl(trimmed)
    }
  }

  const handleQuickPreset = (presetUrl: string) => {
    setInputUrl(presetUrl)
    setUrl(presetUrl)
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
      downloadLink.download = `SeasonQR-${actualSeason}-${topDown ? 'scan' : '3d'}-${Date.now()}.png`
      downloadLink.href = dataUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22c55e', '#a3e635', '#facc15'],
      })
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Dynamic seasonal background styling for distinct character
  const getSeasonBackgroundClass = () => {
    switch (actualSeason) {
      case 'spring':
        return 'bg-gradient-to-b from-[#fff6f8] via-[#fdf0f4] to-[#f4e2ec]'
      case 'autumn':
        return 'bg-gradient-to-b from-[#fefaf4] via-[#fbf2e4] to-[#f2e6d6]'
      case 'winter':
        return 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e1e9f0]'
      case 'cyberpunk':
        return 'bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#1e1b4b] text-white'
      case 'summer':
      default:
        return 'bg-gradient-to-b from-[#fcfdf9] via-[#f7f9f2] to-[#ebf2e4]'
    }
  }

  const getSeasonBadgeInfo = () => {
    switch (actualSeason) {
      case 'spring':
        return { label: 'Xuân Hoa Anh Đào', icon: '🌸', color: 'bg-pink-100 text-pink-700 border-pink-200' }
      case 'autumn':
        return { label: 'Thu Lá Đỏ', icon: '🍁', color: 'bg-amber-100 text-amber-700 border-amber-200' }
      case 'winter':
        return { label: 'Đông Tuyết Trắng', icon: '❄️', color: 'bg-sky-100 text-sky-700 border-sky-200' }
      case 'cyberpunk':
        return { label: 'Cyberpunk Neon', icon: '🔮', color: 'bg-fuchsia-900/60 text-fuchsia-300 border-fuchsia-700' }
      case 'summer':
      default:
        return { label: 'Hạ Rực Rỡ', icon: '☀️', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    }
  }

  const badge = getSeasonBadgeInfo()

  return (
    <main className={`relative w-screen h-screen overflow-hidden select-none font-sans transition-colors duration-700 text-stone-800 ${getSeasonBackgroundClass()}`}>
      {/* 1. DISTINCTIVE HEADER WITH BRAND IDENTITY */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
        {/* Brand Logo & Active Season Badge */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-base shadow-md border border-stone-700/30">
            🌳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-stone-900 text-lg tracking-tight">SeasonQR</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-xs ${badge.color}`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Trình Tạo Mã QR 3D Nghệ Thuật • 100% Client-side
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsScanGuideOpen(true)}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-sm transition-all"
            title="Mẹo quét mã QR"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeployGuideOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200 shadow-sm text-xs font-semibold transition-all"
            title="Hướng dẫn Deploy GitHub Pages miễn phí"
          >
            <span>Deploy Free</span>
          </button>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-sm transition-all"
            title="Tùy chọn phong cách"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-sm transition-all"
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
        title="Chạm vào cây để xem mã QR (Góc nhìn cố định chuẩn)"
      />

      {/* 3. FIXED CAMERA & PERFORMANCE BADGE (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-stone-200/80 text-[11px] text-stone-600 shadow-sm font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Góc nhìn cố định • 60 FPS mượt mà</span>
      </div>

      {/* 4. SIGNATURE CENTER MORPH PILL BUTTON */}
      <div className="fixed bottom-40 md:bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={() => {
            const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
            setViewMode(nextMode)
            soundEngine.playMorphSound(nextMode === 'topDown')
          }}
          className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-lg hover:shadow-xl border border-stone-300/80 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-semibold"
        >
          {viewMode === 'isometric' ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Chạm cây để xem mã QR (Góc quét 90°)</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 text-stone-700" />
              <span>Chạm để quay lại Cây Bốn Mùa 3D</span>
            </>
          )}
        </button>
      </div>

      {/* 5. SIGNATURE BOTTOM CONTROL DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-auto flex flex-col items-center gap-2.5">
        {/* Row 1: URL Input Bar */}
        <form
          onSubmit={handleUrlSubmit}
          className="w-full flex items-center bg-white/95 rounded-2xl shadow-lg border border-stone-200 p-1.5 backdrop-blur-md transition-all focus-within:shadow-xl focus-within:border-stone-400"
        >
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onBlur={() => handleUrlSubmit()}
            placeholder="Nhập link bất kỳ (https://...)"
            className="flex-1 px-4 py-2 text-sm text-stone-800 bg-transparent outline-none placeholder:text-stone-400 font-medium"
          />
          <button
            type="submit"
            onClick={() => handleExport(viewMode === 'topDown')}
            disabled={isExporting}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-sm transition-all active:scale-95 flex items-center justify-center"
            title="Tải ảnh QR (HD)"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Row 1.5: Quick Presets */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
          <span className="opacity-70">Gợi ý:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('https://facebook.com/')}
            className="px-2 py-0.5 rounded-md bg-white/60 hover:bg-white text-stone-700 border border-stone-200/60 shadow-xs transition-colors"
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('https://tiktok.com/')}
            className="px-2 py-0.5 rounded-md bg-white/60 hover:bg-white text-stone-700 border border-stone-200/60 shadow-xs transition-colors"
          >
            TikTok
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('https://seasonqr.dev/')}
            className="px-2 py-0.5 rounded-md bg-white/60 hover:bg-white text-stone-700 border border-stone-200/60 shadow-xs transition-colors"
          >
            Portfolio
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('https://icqr.com/')}
            className="px-2 py-0.5 rounded-md bg-white/60 hover:bg-white text-stone-700 border border-stone-200/60 shadow-xs transition-colors"
          >
            Website
          </button>
        </div>

        {/* Row 2: Season Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 backdrop-blur-md border border-stone-200/80 shadow-md text-xs font-semibold text-stone-600">
          <button
            onClick={() => setSelectedSeason('spring')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'spring'
                ? 'bg-pink-100 text-pink-800 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            <span>🌸</span>
            <span>Xuân</span>
          </button>

          <button
            onClick={() => setSelectedSeason('summer')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'summer'
                ? 'bg-emerald-100 text-emerald-800 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            <span>☀️</span>
            <span>Hạ</span>
          </button>

          <button
            onClick={() => setSelectedSeason('autumn')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'autumn'
                ? 'bg-amber-100 text-amber-800 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            <span>🍁</span>
            <span>Thu</span>
          </button>

          <button
            onClick={() => setSelectedSeason('winter')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              selectedSeason === 'winter'
                ? 'bg-sky-100 text-sky-800 shadow-xs'
                : 'hover:text-stone-900'
            }`}
          >
            <span>❄️</span>
            <span>Đông</span>
          </button>

          {/* Sound / Mute Button */}
          <button
            onClick={toggleSound}
            className={`p-1.5 ml-0.5 rounded-lg transition-colors ${isMuted ? 'text-stone-400 hover:text-stone-700' : 'text-emerald-700 bg-emerald-50'}`}
            title={isMuted ? 'Bật âm thanh thiên nhiên' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 6. SLIDE-OVER SETTINGS DRAWER */}
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
                      <div className="text-xs font-bold">Cây Bonsai 4 Mùa</div>
                      <div className="text-[10px] text-stone-500">Tán lá low-poly, cỏ hoa & biến hình thành mã QR</div>
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

              {/* Extra Actions */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <button
                  onClick={() => handleExport(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải ảnh 3D Isometric (HD)</span>
                </button>

                <button
                  onClick={() => handleExport(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải mã QR Top-Down (Dành để in/quét)</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 text-[11px] text-stone-500 text-center">
              SeasonQR • 100% Client-side & Free
            </div>
          </div>
        </div>
      )}

      {/* 7. Modals */}
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
