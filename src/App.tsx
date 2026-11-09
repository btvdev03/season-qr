import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { ScanGuideModal } from './components/ScanGuideModal'
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
  ExternalLink,
  Activity,
} from 'lucide-react'
import {
  recordQRGeneration,
  fetchGlobalQRCount,
  getLocalUserCount,
  getCachedGlobalCount,
  formatCount,
} from './utils/qrCounter'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  // Core App State
  const [url, setUrl] = useState<string>('https://btvdev03.github.io/season-qr/')
  const [inputUrl, setInputUrl] = useState<string>('https://btvdev03.github.io/season-qr/')
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>('summer')
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('tree')
  const [viewMode, setViewMode] = useState<ViewMode>('isometric')
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false)

  // Live QR Creation Counter State
  const [globalQRCount, setGlobalQRCount] = useState<number>(() => getCachedGlobalCount())
  const [userQRCount, setUserQRCount] = useState<number>(() => getLocalUserCount())

  // Interactive Settings State
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false)
  const [isWeatherEnabled, setIsWeatherEnabled] = useState<boolean>(true)
  const [isCameraLocked, setIsCameraLocked] = useState<boolean>(true)
  const [exportQuality, setExportQuality] = useState<'1080p' | '2k' | '4k'>('1080p')

  // Modals
  const [isScanGuideOpen, setIsScanGuideOpen] = useState<boolean>(false)

  const actualSeason = resolveSeason(selectedSeason)

  // Initialize Three.js SceneManager once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const manager = new SceneManager({
      container: containerRef.current,
      initialUrl: url,
      initialSeason: actualSeason,
      initialStyle: selectedStyle,
      autoRotate: false,
      onViewModeChange: (newMode) => {
        setViewMode(newMode)
        soundEngine.playMorphSound(newMode === 'topDown')
      },
    })

    sceneManagerRef.current = manager
    ;(window as any).__sceneManager = manager

    return () => {
      manager.dispose()
      sceneManagerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch live global QR creation count on mount
  useEffect(() => {
    let isMounted = true
    fetchGlobalQRCount().then((count) => {
      if (isMounted) setGlobalQRCount(count)
    })
    return () => {
      isMounted = false
    }
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

  // URL Submit handler with automatic creation tracking
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputUrl.trim()
    if (trimmed && trimmed !== url) {
      setUrl(trimmed)
      recordQRGeneration().then(({ globalCount, userCount }) => {
        setGlobalQRCount(globalCount)
        setUserQRCount(userCount)
      })
    }
  }

  const handleQuickPreset = (presetUrl: string) => {
    if (presetUrl !== url) {
      setInputUrl(presetUrl)
      setUrl(presetUrl)
      recordQRGeneration().then(({ globalCount, userCount }) => {
        setGlobalQRCount(globalCount)
        setUserQRCount(userCount)
      })
    } else {
      setInputUrl(presetUrl)
    }
  }

  // HD Snapshot Export handler
  const handleExport = async (topDown: boolean = false) => {
    if (!sceneManagerRef.current || isExporting) return

    setIsExporting(true)
    try {
      const resMap = {
        '1080p': 1920,
        '2k': 2560,
        '4k': 3840,
      }
      const dimension = resMap[exportQuality] || 1920

      const dataUrl = await sceneManagerRef.current.exportSnapshot({
        width: dimension,
        height: dimension,
        topDown: topDown,
      })

      const downloadLink = document.createElement('a')
      downloadLink.download = `SeasonQR-${actualSeason}-${topDown ? 'scan' : '3d'}-${exportQuality}-${Date.now()}.png`
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
      case 'summer':
      default:
        return 'radial-gradient(circle at 50% 46%, rgba(74, 222, 128, 0.24) 0%, rgba(187, 247, 208, 0.35) 30%, transparent 68%)'
    }
  }

  const getSeasonBadgeInfo = () => {
    switch (actualSeason) {
      case 'spring':
        return {
          label: 'Xuân Đào Mai',
          shortLabel: 'Xuân',
          icon: '🌸',
          color: 'bg-pink-100 text-pink-800 border-pink-200',
        }
      case 'autumn':
        return {
          label: 'Thu Cúc Vàng',
          shortLabel: 'Thu',
          icon: '🍁',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
        }
      case 'winter':
        return {
          label: 'Đông Sa Pa',
          shortLabel: 'Đông',
          icon: '❄️',
          color: 'bg-sky-100 text-sky-800 border-sky-200',
        }
      case 'summer':
      default:
        return {
          label: 'Hạ Phượng Vĩ',
          shortLabel: 'Hạ',
          icon: '☀️',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
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

      {/* 1. DISTINCTIVE RESPONSIVE HEADER */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4 pointer-events-none gap-2">
        {/* Brand Logo & Active Season Badge */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md border border-stone-700/30 shrink-0">
            🌳
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-stone-900 text-base sm:text-lg tracking-tight shrink-0">
                SeasonQR
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shadow-xs whitespace-nowrap shrink-0 ${badge.color}`}
              >
                <span>{badge.icon}</span>
                <span className="hidden sm:inline">{badge.label}</span>
                <span className="sm:hidden">{badge.shortLabel}</span>
              </span>

              {/* Global QR Creation Counter Badge */}
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 shadow-2xs whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer"
                title="Tổng số lượt mã QR đã tạo toàn cầu (Nhấp để xem chi tiết)"
              >
                <span className="text-[11px]">⚡</span>
                <span className="hidden sm:inline">{formatCount(globalQRCount)} lượt tạo</span>
                <span className="sm:hidden">{formatCount(globalQRCount, true)} tạo</span>
              </button>
            </div>
            <div className="text-[11px] text-stone-600 font-medium hidden sm:block truncate">
              Trình Tạo Mã QR 3D Nghệ Thuật 4 Mùa Việt Nam • 100% Client-side
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            onClick={() => setIsScanGuideOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 shadow-xs transition-all active:scale-95"
            title="Mẹo quét mã QR"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2 sm:p-2.5 rounded-xl bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 shadow-xs transition-all active:scale-95"
            title="Cài đặt & Tùy chọn"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <a
            href="https://btvdev03.github.io/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-xl bg-white/90 hover:bg-white text-stone-800 hover:text-stone-900 border border-stone-200/90 shadow-xs text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Xem Portfolio Võ Tấn Bản (btvdev03)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Portfolio</span>
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
      <div className="fixed bottom-6 left-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/80 text-[11px] text-stone-700 shadow-sm font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Góc nhìn cố định • 60 FPS mượt mà</span>
      </div>

      {/* 4. FLOATING PERSPECTIVE HINT PILL */}
      <div className={`fixed ${viewMode === 'topDown' ? 'bottom-40 sm:bottom-36' : 'bottom-[148px] sm:bottom-44'} left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-300 w-max max-w-[92vw]`}>
        <button
          onClick={() => {
            const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
            setViewMode(nextMode)
            soundEngine.playMorphSound(nextMode === 'topDown')
          }}
          className="group flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/95 hover:bg-white text-stone-800 shadow-lg hover:shadow-xl border border-stone-200/90 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-[11px] sm:text-xs font-bold whitespace-nowrap"
        >
          {viewMode === 'isometric' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span>Chạm cây để xem mã QR (Góc 90°)</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tap to see the tree (Xem cây 3D)</span>
            </>
          )}
        </button>
      </div>

      {/* 5. LUXURY FLOATING ISLAND COMMAND DOCK */}
      <div className="fixed bottom-2.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-3 sm:px-4 pointer-events-auto pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
        <div className="w-full bg-white/92 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-2xl border border-stone-200/80 flex flex-col gap-2 sm:gap-2.5 transition-all">
          {/* Row 1: Integrated URL Input & Action Cluster */}
          <form
            onSubmit={handleUrlSubmit}
            className="flex items-center gap-1.5 sm:gap-2 bg-stone-100 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 border border-stone-200/80 focus-within:border-stone-400 focus-within:bg-white transition-all"
          >
            <div className="pl-2 sm:pl-2.5 text-stone-500 shrink-0">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onBlur={() => handleUrlSubmit()}
              placeholder="Nhập link bất kỳ: Zalo, FB, Web (https://...)"
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none font-semibold truncate"
            />

            {/* Quick Action 1: 3D <-> Scan 90deg Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
                setViewMode(nextMode)
                soundEngine.playMorphSound(nextMode === 'topDown')
              }}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 ${
                viewMode === 'topDown'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-800 hover:text-stone-900 border border-stone-200/90 shadow-xs'
              }`}
              title={viewMode === 'isometric' ? 'Chuyển sang góc quét QR 90°' : 'Quay lại góc nhìn 3D Isometric'}
            >
              {viewMode === 'isometric' ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
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
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition-all active:scale-95 shrink-0 flex items-center justify-center"
              title={`Tải ảnh QR (${exportQuality.toUpperCase()})`}
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Row 1.5: Quick Presets */}
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-stone-600 gap-1.5">
            <span className="opacity-75 text-[10px] shrink-0">Gợi ý nhanh:</span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                { name: 'Zalo', url: 'https://zalo.me/' },
                { name: 'Facebook', url: 'https://facebook.com/' },
                { name: 'Portfolio', url: 'https://btvdev03.github.io/' },
                { name: 'GitHub', shortName: 'GitHub', url: 'https://github.com/btvdev03/season-qr' },
              ].map(({ name, url: presetUrl }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleQuickPreset(presetUrl)}
                  className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/80 text-[10px] font-semibold transition-all active:scale-95 shadow-2xs whitespace-nowrap shrink-0"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: 4-Season Segmented Tab Switcher */}
          <div className="flex items-center justify-between gap-1 p-1 rounded-xl sm:rounded-2xl bg-stone-100 border border-stone-200/80 text-xs font-bold">
            {[
              { id: 'spring', label: 'Xuân', icon: '🌸', activeClass: 'bg-pink-100 text-pink-900 border-pink-300 shadow-xs' },
              { id: 'summer', label: 'Hạ', icon: '☀️', activeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs' },
              { id: 'autumn', label: 'Thu', icon: '🍁', activeClass: 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs' },
              { id: 'winter', label: 'Đông', icon: '❄️', activeClass: 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs' },
            ].map((s) => {
              const isSelected = selectedSeason === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.id as SeasonKey)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-transparent transition-all ${
                    isSelected
                      ? s.activeClass
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
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
              className={`p-1.5 ml-0.5 rounded-lg sm:rounded-xl transition-all shrink-0 ${
                isMuted
                  ? 'text-stone-400 hover:text-stone-700'
                  : 'text-emerald-700 bg-white shadow-xs'
              }`}
              title={isMuted ? 'Bật âm thanh thiên nhiên' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>
        </div>
      </div>

      {/* 6. SLIDE-OVER SETTINGS DRAWER (100% Functional) */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/25 backdrop-blur-xs">
          <div
            className="absolute inset-0"
            onClick={() => setShowSettingsDrawer(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 border-l border-stone-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-stone-900 text-sm">Cài Đặt & Kiểu Dáng</h3>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors font-bold"
                >
                  ✕
                </button>
              </div>

              {/* LIVE QR CREATION COUNTER STATS */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="text-amber-600 font-black">⚡</span> Thống Kê Số Lượt Tạo QR
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 text-amber-900 border border-amber-200">
                    <Activity className="w-3 h-3 text-amber-600 animate-pulse" />
                    <span>Thời gian thực</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/70 shadow-xs">
                    <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Toàn cầu</div>
                    <div className="text-xl font-black text-amber-900 tracking-tight mt-0.5">
                      {formatCount(globalQRCount)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/70 shadow-xs">
                    <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Trên máy bạn</div>
                    <div className="text-xl font-black text-stone-800 tracking-tight mt-0.5">
                      {formatCount(userQRCount)}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-amber-900/75 leading-relaxed">
                  Tự động đếm và đồng bộ mỗi khi bạn hoặc người dùng nhập link / tạo mã QR mới.
                </p>
              </div>

              {/* Setting 1: 3D Diorama Style Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Phong Cách Diorama 3D
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'tree',
                      name: 'Cây Bonsai Cổ Thụ 4 Mùa',
                      desc: 'Tán lá 4 mùa Việt Nam, cành nhánh PBR, vườn cỏ hoa dại & rêu phong ôm gốc',
                      icon: '🌳',
                    },
                    {
                      id: 'island',
                      name: 'Đảo Ngọc Non Nước',
                      desc: 'Kỳ quan đảo nổi bồng bềnh non nước Việt Nam với nhũ đá kỳ vĩ & rễ cây buông rủ',
                      icon: '🏝️',
                    },
                    {
                      id: 'zen',
                      name: 'Vườn Thiền Non Bộ',
                      desc: 'Nghệ thuật hòn non bộ cổ kính, đèn đá tỏa sáng và sỏi thiền tĩnh tại',
                      icon: '⛩️',
                    },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id as StyleKey)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                        selectedStyle === style.id
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-stone-900">{style.name}</div>
                        <div className="text-[11px] text-stone-500 leading-snug mt-0.5">{style.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Setting 2: Camera & Interaction Controls */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Tương Tác & Camera
                </label>

                {/* Auto Rotate Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-800">Tự động xoay 360°</div>
                    <div className="text-[10px] text-stone-500">Xoay chậm nhẹ nhàng để ngắm toàn cảnh diorama</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isAutoRotate
                      setIsAutoRotate(next)
                      sceneManagerRef.current?.setAutoRotate(next)
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isAutoRotate ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* Weather Particles Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-800">Hiệu ứng thời tiết</div>
                    <div className="text-[10px] text-stone-500">Cánh hoa đào, đom đóm, lá phong, tuyết rơi</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isWeatherEnabled
                      setIsWeatherEnabled(next)
                      sceneManagerRef.current?.setWeatherEnabled(next)
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isWeatherEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* Camera Rotation Lock Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-800">Khóa góc camera chuẩn</div>
                    <div className="text-[10px] text-stone-500">Góc cố định mượt mà 60 FPS không trôi góc</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !isCameraLocked
                      setIsCameraLocked(next)
                      sceneManagerRef.current?.setCameraRotationLock(next)
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isCameraLocked ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>

              {/* Setting 3: Export Resolution */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Độ Phân Giải Tải Ảnh
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1080p', label: '1080p', desc: '1920px' },
                    { id: '2k', label: '2K QHD', desc: '2560px' },
                    { id: '4k', label: '4K Ultra', desc: '3840px' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setExportQuality(res.id as '1080p' | '2k' | '4k')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        exportQuality === res.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                      }`}
                    >
                      <div className="text-xs">{res.label}</div>
                      <div className="text-[10px] text-stone-400">{res.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    onClick={() => handleExport(false)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải ảnh 3D Isometric ({exportQuality.toUpperCase()})</span>
                  </button>

                  <button
                    onClick={() => handleExport(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải mã QR 90° Quét Ngay ({exportQuality.toUpperCase()})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-stone-200 text-[11px] text-stone-500 text-center space-y-1">
              <div>SeasonQR • Trình tạo mã QR 3D nghệ thuật Việt Nam</div>
              <div>
                Tác giả:{' '}
                <a
                  href="https://btvdev03.github.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-bold underline hover:text-emerald-800"
                >
                  Võ Tấn Bản (btvdev03)
                </a>
              </div>
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
    </main>
  )
}
