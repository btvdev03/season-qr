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
  Volume2,
  VolumeX,
  SlidersHorizontal,
  HelpCircle,
  Download,
  ShieldCheck,
  Link2,
  Camera,
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

  // Dynamic seasonal background styling for luxury museum atmosphere
  const getSeasonBackgroundClass = () => {
    switch (actualSeason) {
      case 'spring':
        return 'from-[#fff5f8] via-[#fdf0f4] to-[#f5e1eb]'
      case 'autumn':
        return 'from-[#fefcf8] via-[#fbf3e6] to-[#f4e4d0]'
      case 'winter':
        return 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'
      case 'cyberpunk':
        return 'from-[#070913] via-[#0d1021] to-[#150d28] text-white'
      case 'summer':
      default:
        return 'from-[#f8faf7] via-[#f1f7f1] to-[#e4ede5]'
    }
  }

  // Luminous radial aura positioned right behind the 3D diorama
  const getSeasonAuraGradient = () => {
    switch (actualSeason) {
      case 'spring':
        return 'radial-gradient(circle at 50% 46%, rgba(244, 114, 182, 0.22) 0%, rgba(251, 207, 232, 0.35) 30%, transparent 68%)'
      case 'autumn':
        return 'radial-gradient(circle at 50% 46%, rgba(245, 158, 11, 0.22) 0%, rgba(253, 230, 138, 0.35) 30%, transparent 68%)'
      case 'winter':
        return 'radial-gradient(circle at 50% 46%, rgba(56, 189, 248, 0.22) 0%, rgba(224, 242, 254, 0.4) 30%, transparent 68%)'
      case 'cyberpunk':
        return 'radial-gradient(circle at 50% 46%, rgba(6, 182, 212, 0.24) 0%, rgba(217, 70, 239, 0.2) 32%, transparent 70%)'
      case 'summer':
      default:
        return 'radial-gradient(circle at 50% 46%, rgba(74, 222, 128, 0.24) 0%, rgba(187, 247, 208, 0.35) 30%, transparent 68%)'
    }
  }

  const getSeasonBadgeInfo = () => {
    switch (actualSeason) {
      case 'spring':
        return {
          label: 'Xuân Sakura',
          icon: '🌸',
          color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
        }
      case 'autumn':
        return {
          label: 'Thu Phong Đỏ',
          icon: '🍁',
          color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        }
      case 'winter':
        return {
          label: 'Đông Băng Tuyết',
          icon: '❄️',
          color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        }
      case 'cyberpunk':
        return {
          label: 'Cyberpunk Neon',
          icon: '⚡',
          color: 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-700',
        }
      case 'summer':
      default:
        return {
          label: 'Hạ Lục Bảo',
          icon: '☀️',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        }
    }
  }

  const badge = getSeasonBadgeInfo()

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden select-none font-sans transition-colors duration-700 text-stone-800 bg-gradient-to-b ${getSeasonBackgroundClass()}`}
    >
      {/* AMBIENT RADIAL SPOTLIGHT AURA */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
        style={{ background: getSeasonAuraGradient() }}
      />

      {/* 1. DISTINCTIVE HEADER WITH BRAND IDENTITY */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
        {/* Brand Logo & Active Season Badge */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-base shadow-md border border-stone-700/30">
            🌳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-stone-900 dark:text-white text-lg tracking-tight">
                SeasonQR
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-xs ${badge.color}`}
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
              Trình Tạo Mã QR 3D Nghệ Thuật • 100% Client-side
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsScanGuideOpen(true)}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-700 shadow-sm transition-all"
            title="Mẹo quét mã QR"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeployGuideOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-700 shadow-sm text-xs font-semibold transition-all"
            title="Hướng dẫn Deploy GitHub Pages miễn phí"
          >
            <span>Deploy Free</span>
          </button>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-700 shadow-sm transition-all"
            title="Tùy chọn phong cách"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-700 shadow-sm transition-all"
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
      <div className="fixed bottom-6 left-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 dark:bg-stone-900/75 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 shadow-sm font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Góc nhìn cố định • 60 FPS mượt mà</span>
      </div>

      {/* 4. FLOATING PERSPECTIVE HINT PILL */}
      <div className="fixed bottom-36 sm:bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={() => {
            const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
            setViewMode(nextMode)
            soundEngine.playMorphSound(nextMode === 'topDown')
          }}
          className="group flex items-center gap-2 px-5 py-2 rounded-full bg-white/85 dark:bg-stone-900/85 hover:bg-white dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 shadow-md hover:shadow-lg border border-stone-200/80 dark:border-stone-700 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-semibold"
        >
          {viewMode === 'isometric' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>Chạm cây để xem mã QR (Góc quét 90°)</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
              <span>Chạm để quay lại Cây Bốn Mùa 3D</span>
            </>
          )}
        </button>
      </div>

      {/* 5. LUXURY FLOATING ISLAND COMMAND DOCK */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4 pointer-events-auto">
        <div className="w-full bg-white/85 dark:bg-stone-900/85 backdrop-blur-2xl rounded-3xl p-3 shadow-2xl border border-white/80 dark:border-white/10 flex flex-col gap-2.5 transition-all">
          {/* Row 1: Integrated URL Input & Action Cluster */}
          <form
            onSubmit={handleUrlSubmit}
            className="flex items-center gap-2 bg-stone-100/80 dark:bg-stone-800/80 rounded-2xl p-1.5 border border-stone-200/70 dark:border-stone-700/60 focus-within:border-stone-400 dark:focus-within:border-stone-500 transition-all"
          >
            <div className="pl-2.5 text-stone-400 dark:text-stone-500">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onBlur={() => handleUrlSubmit()}
              placeholder="Nhập link bất kỳ (https://...)"
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none font-medium"
            />

            {/* Quick Action 1: 3D <-> Scan 90deg Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
                setViewMode(nextMode)
                soundEngine.playMorphSound(nextMode === 'topDown')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                viewMode === 'topDown'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white border border-stone-200/80 dark:border-stone-600 shadow-xs'
              }`}
              title={viewMode === 'isometric' ? 'Chuyển sang góc quét QR 90°' : 'Quay lại góc nhìn 3D Isometric'}
            >
              {viewMode === 'isometric' ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Quét 90°</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cây 3D</span>
                </>
              )}
            </button>

            {/* Quick Action 2: HD Snapshot Export */}
            <button
              type="button"
              onClick={() => handleExport(viewMode === 'topDown')}
              disabled={isExporting}
              className="p-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 shadow-xs transition-all active:scale-95 flex items-center justify-center"
              title="Tải ảnh QR (HD)"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Row 1.5: Quick Presets */}
          <div className="flex items-center justify-between px-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
            <span className="opacity-70 text-[10px]">Gợi ý nhanh:</span>
            <div className="flex items-center gap-1">
              {['Facebook', 'TikTok', 'Portfolio', 'Website'].map((name) => {
                const map: Record<string, string> = {
                  Facebook: 'https://facebook.com/',
                  TikTok: 'https://tiktok.com/',
                  Portfolio: 'https://seasonqr.dev/',
                  Website: 'https://icqr.com/',
                }
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleQuickPreset(map[name])}
                    className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 text-[10px] transition-all"
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: 5-Season Segmented Tab Switcher */}
          <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 text-xs font-semibold">
            {[
              { id: 'spring', label: 'Xuân', icon: '🌸', activeClass: 'bg-pink-100 text-pink-900 border-pink-300 shadow-xs' },
              { id: 'summer', label: 'Hạ', icon: '☀️', activeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs' },
              { id: 'autumn', label: 'Thu', icon: '🍁', activeClass: 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs' },
              { id: 'winter', label: 'Đông', icon: '❄️', activeClass: 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs' },
              { id: 'cyberpunk', label: 'Cyber', icon: '⚡', activeClass: 'bg-fuchsia-900/60 text-fuchsia-200 border-fuchsia-600 shadow-xs' },
            ].map((s) => {
              const isSelected = selectedSeason === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.id as SeasonKey)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-transparent transition-all ${
                    isSelected
                      ? s.activeClass
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/50 dark:hover:bg-stone-700/50'
                  }`}
                >
                  <span className="text-xs">{s.icon}</span>
                  <span className="text-[11px]">{s.label}</span>
                </button>
              )
            })}

            {/* Sound / Mute Toggle Button */}
            <button
              onClick={toggleSound}
              className={`p-1.5 ml-0.5 rounded-xl transition-all ${
                isMuted
                  ? 'text-stone-400 hover:text-stone-700 dark:text-stone-500'
                  : 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-stone-700 shadow-xs'
              }`}
              title={isMuted ? 'Bật âm thanh thiên nhiên' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>
        </div>
      </div>

      {/* 6. SLIDE-OVER SETTINGS DRAWER */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-xs">
          <div
            className="absolute inset-0"
            onClick={() => setShowSettingsDrawer(false)}
          />
          <div className="relative w-full max-w-xs h-full bg-white dark:bg-stone-900 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 border-l border-stone-200 dark:border-stone-800">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-bold text-stone-800 dark:text-white text-sm">Cài Đặt & Kiểu Dáng</h3>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  ✕
                </button>
              </div>

              {/* Style Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400">Phong cách 3D:</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setSelectedStyle('tree')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === 'tree'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-xl">🌳</span>
                    <div>
                      <div className="text-xs font-bold">Cây Sồi 3D Chân Thực</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">Tán lá rực rỡ theo mùa, cành nhánh PBR & biến hình mã QR</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedStyle('island')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === 'island'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-xl">🏝️</span>
                    <div>
                      <div className="text-xs font-bold">Đảo Voxel Bồng Bềnh</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">Đảo bay lơ lửng với nhũ đá bên dưới</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedStyle('zen')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === 'zen'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-xl">⛩️</span>
                    <div>
                      <div className="text-xs font-bold">Vườn Đá Zen</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">Đèn đá Toro và cổng Torii Nhật Bản</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Extra Actions */}
              <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => handleExport(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition-all"
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

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 text-center">
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
