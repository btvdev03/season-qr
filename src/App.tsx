import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { SeasonKey, StyleKey, ViewMode } from './types'
import { resolveSeason, getAutoSeason } from './utils/seasonUtils'
import { SceneManager } from './engine/SceneManager'
import { soundEngine } from './utils/audioAmbiance'
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  Link2,
  Camera,
  ExternalLink,
  X,
  ImagePlus,
  Image as ImageIcon,
} from 'lucide-react'
import {
  recordQRGeneration,
  fetchGlobalQRCount,
  getCachedGlobalCount,
  formatCount,
} from './utils/qrCounter'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Core App State (Auto-detect season based on month: Tháng 11 = Đông Sa Pa)
  const [url, setUrl] = useState<string>('https://btvdev03.github.io/season-qr/')
  const [inputUrl, setInputUrl] = useState<string>('https://btvdev03.github.io/season-qr/')
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('season')
      if (p === 'spring' || p === 'summer' || p === 'autumn' || p === 'winter') return p
    }
    return getAutoSeason()
  })
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('style')
      if (s === 'photo' || s === 'tree' || s === 'island' || s === 'zen') return s
    }
    return 'tree'
  })
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view')
      if (v === 'topDown') return 'topDown'
    }
    return 'isometric'
  })
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false)

  // Live QR Creation Counter State (Null on first-ever visit until live count resolves)
  const [globalQRCount, setGlobalQRCount] = useState<number | null>(() => getCachedGlobalCount())

  // Interactive Settings State
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false)
  const [isWeatherEnabled, setIsWeatherEnabled] = useState<boolean>(true)
  const [isCameraLocked, setIsCameraLocked] = useState<boolean>(true)
  const [exportQuality, setExportQuality] = useState<'1080p' | '2k' | '4k'>('1080p')

  const actualSeason = resolveSeason(selectedSeason)

  // Initialize Three.js SceneManager once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const manager = new SceneManager({
      container: containerRef.current,
      initialUrl: url,
      initialSeason: actualSeason,
      initialStyle: selectedStyle,
      initialPhotoUrl: uploadedPhotoUrl,
      autoRotate: false,
      onViewModeChange: (newMode) => {
        setViewMode(newMode)
        soundEngine.playMorphSound(newMode === 'topDown')
      },
    })

    sceneManagerRef.current = manager
    ;(window as any).__sceneManager = manager
    if (viewMode === 'topDown') {
      manager.setViewMode('topDown', false)
    }

    return () => {
      manager.dispose()
      sceneManagerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch latest live global QR creation count immediately & refresh when tab refocuses
  useEffect(() => {
    let isMounted = true
    fetchGlobalQRCount().then((count) => {
      if (isMounted) setGlobalQRCount(count)
    })

    const refreshLiveCount = () => {
      if (document.visibilityState === 'visible') {
        fetchGlobalQRCount(true).then((count) => {
          if (isMounted) setGlobalQRCount(count)
        })
      }
    }

    window.addEventListener('focus', refreshLiveCount)
    document.addEventListener('visibilitychange', refreshLiveCount)
    return () => {
      isMounted = false
      window.removeEventListener('focus', refreshLiveCount)
      document.removeEventListener('visibilitychange', refreshLiveCount)
    }
  }, [])

  // Sync QR URL, Season, Style, and Uploaded Photo changes with the 3D scene
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateScene(url, actualSeason, selectedStyle, uploadedPhotoUrl)
    }
  }, [url, actualSeason, selectedStyle, uploadedPhotoUrl])

  // Sync Sound Mute & Season changes
  useEffect(() => {
    soundEngine.setMuted(isMuted, actualSeason)
  }, [isMuted, actualSeason])

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

  // Client-side Photo Upload: center-crops 1:1 square (max 1024px) on crisp white canvas
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type && !file.type.startsWith('image/')) return

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width
        const naturalH = img.naturalHeight || img.height
        const cropSide = Math.min(naturalW, naturalH)
        if (cropSide <= 0) return

        const targetSize = Math.min(cropSide, 1024)
        const sx = (naturalW - cropSide) / 2
        const sy = (naturalH - cropSide) / 2

        const canvas = document.createElement('canvas')
        canvas.width = targetSize
        canvas.height = targetSize
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetSize, targetSize)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, cropSide, cropSide, 0, 0, targetSize, targetSize)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        setUploadedPhotoUrl(dataUrl)
        setSelectedStyle('photo')
        recordQRGeneration().then(({ globalCount }) => {
          setGlobalQRCount(globalCount)
        })
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
    }

    img.src = objectUrl
  }

  // URL Submit handler with automatic creation tracking
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputUrl.trim()
    if (trimmed && trimmed !== url) {
      setUrl(trimmed)
      recordQRGeneration().then(({ globalCount }) => {
        setGlobalQRCount(globalCount)
      })
    }
  }

  const handleQuickPreset = (presetUrl: string) => {
    if (presetUrl !== url) {
      setInputUrl(presetUrl)
      setUrl(presetUrl)
      recordQRGeneration().then(({ globalCount }) => {
        setGlobalQRCount(globalCount)
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

      const themeTag = selectedStyle === 'photo' ? 'photo' : actualSeason
      const downloadLink = document.createElement('a')
      downloadLink.download = `SeasonQR-${themeTag}-${topDown ? 'scan' : '3d'}-${exportQuality}-${Date.now()}.png`
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

  // Dynamic seasonal / studio background styling (pure crisp white in 90° scan mode)
  const getSeasonBackgroundClass = () => {
    if (viewMode === 'topDown') {
      return 'from-white via-white to-white'
    }
    if (selectedStyle === 'photo') {
      return 'from-[#f8fafc] via-[#f4f6f9] to-[#e9eef5]'
    }
    switch (actualSeason) {
      case 'spring':
        return 'from-[#fffef7] via-[#fefbf0] to-[#fef3c7]/30'
      case 'autumn':
        return 'from-[#fefcf8] via-[#fbf3e6] to-[#f4e4d0]'
      case 'winter':
        return 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'
      case 'summer':
      default:
        return 'from-[#f8faf7] via-[#f1f7f1] to-[#e4ede5]'
    }
  }

  // Luminous radial aura positioned right behind the 3D diorama (fades to transparent in 90° scan mode)
  const getSeasonAuraGradient = () => {
    if (viewMode === 'topDown') {
      return 'transparent'
    }
    if (selectedStyle === 'photo') {
      return 'radial-gradient(circle at 50% 46%, rgba(148, 163, 184, 0.22) 0%, rgba(226, 232, 240, 0.42) 32%, transparent 68%)'
    }
    switch (actualSeason) {
      case 'spring':
        return 'radial-gradient(circle at 50% 46%, rgba(234, 179, 8, 0.22) 0%, rgba(254, 240, 138, 0.35) 30%, transparent 68%)'
      case 'autumn':
        return 'radial-gradient(circle at 50% 46%, rgba(245, 158, 11, 0.22) 0%, rgba(253, 230, 138, 0.35) 30%, transparent 68%)'
      case 'winter':
        return 'radial-gradient(circle at 50% 46%, rgba(56, 189, 248, 0.22) 0%, rgba(224, 242, 254, 0.4) 30%, transparent 68%)'
      case 'summer':
      default:
        return 'radial-gradient(circle at 50% 46%, rgba(74, 222, 128, 0.24) 0%, rgba(187, 247, 208, 0.35) 30%, transparent 68%)'
    }
  }

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
        {/* Brand Logo & Global Creation Counter */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md border border-stone-700/30 shrink-0">
            🌳
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-stone-900 text-base sm:text-lg tracking-tight shrink-0">
                SeasonQR
              </span>

              {/* Global QR Creation Counter Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-950 border border-amber-300/80 shadow-2xs whitespace-nowrap shrink-0"
                title="Tổng số lượt mã QR đã tạo toàn cầu"
              >
                <span className="text-[11px] text-amber-600 font-black">⚡</span>
                <span className="hidden sm:inline">{formatCount(globalQRCount)} lượt tạo</span>
                <span className="sm:hidden">{formatCount(globalQRCount, true)} tạo</span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 font-medium hidden sm:block truncate">
              Trình Tạo Mã QR 3D Nghệ Thuật 4 Mùa Việt Nam • 100% Client-side
            </div>
          </div>
        </div>

        {/* Top Right Actions: Settings & Portfolio */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
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
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl bg-white/90 hover:bg-white text-stone-800 hover:text-stone-900 border border-stone-200/90 shadow-xs text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Xem Portfolio Võ Tấn Bản (btvdev03)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Portfolio</span>
          </a>
        </div>
      </header>

      {/* Hidden File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* 2. THREE.JS 3D VIEWPORT CONTAINER */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
        title={
          selectedStyle === 'photo'
            ? 'Chạm vào ảnh để xem mã QR (Góc nhìn cố định chuẩn)'
            : 'Chạm vào cây để xem mã QR (Góc nhìn cố định chuẩn)'
        }
      />

      {/* 3. FIXED CAMERA & PERFORMANCE BADGE (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/80 text-[11px] text-stone-700 shadow-sm font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Góc nhìn cố định • 60 FPS mượt mà</span>
      </div>

      {/* 4. FLOATING PERSPECTIVE HINT PILL */}
      <div className="fixed bottom-[max(166px,calc(152px+env(safe-area-inset-bottom,0px)))] sm:bottom-[178px] inset-x-0 mx-auto w-fit max-w-[92vw] z-20 pointer-events-auto transition-all duration-300">
        <button
          type="button"
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
              <span>
                {selectedStyle === 'photo'
                  ? 'Chạm ảnh để biến thành mã QR (Góc 90°)'
                  : 'Chạm cây để xem mã QR (Góc 90°)'}
              </span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {selectedStyle === 'photo'
                  ? 'Chạm để quay lại khối ảnh 3D'
                  : 'Tap to see the tree (Xem cây 3D)'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* 5. LUXURY FLOATING ISLAND COMMAND DOCK */}
      <div className="fixed bottom-2.5 sm:bottom-5 inset-x-0 mx-auto z-20 w-full max-w-md sm:max-w-lg px-2.5 sm:px-4 pointer-events-auto pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
        <div className="w-full bg-white/88 backdrop-blur-2xl rounded-3xl p-2 sm:p-3 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] border border-white/80 ring-1 ring-stone-900/5 flex flex-col gap-2 transition-all">
          {/* Row 1: Integrated URL Input & Action Cluster */}
          <form
            onSubmit={handleUrlSubmit}
            className="flex items-center gap-1.5 bg-stone-100/80 focus-within:bg-white rounded-2xl p-1 sm:p-1.5 border border-stone-200/70 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-2xs min-w-0"
          >
            <div className="pl-2 sm:pl-2.5 text-stone-400 focus-within:text-emerald-600 shrink-0">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <input
              type="text"
              size={1}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onBlur={() => handleUrlSubmit()}
              placeholder="Nhập link bất kỳ (https://...)"
              className="w-full flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none font-semibold truncate"
            />

            {/* Clear Input Button */}
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/60 transition-colors shrink-0"
                title="Xóa nội dung"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Quick Action 1: 3D <-> Scan 90deg Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
                setViewMode(nextMode)
                soundEngine.playMorphSound(nextMode === 'topDown')
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 ${
                viewMode === 'topDown'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-800 hover:text-stone-900 border border-stone-200/90 shadow-2xs'
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
                  <span className="hidden sm:inline">
                    {selectedStyle === 'photo' ? 'Ảnh 3D' : 'Cây 3D'}
                  </span>
                </>
              )}
            </button>

            {/* Quick Action 2: HD Snapshot Export */}
            <button
              type="button"
              onClick={() => handleExport(viewMode === 'topDown')}
              disabled={isExporting}
              className="p-1.5 sm:p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all active:scale-95 shrink-0 flex items-center justify-center disabled:opacity-50"
              title={`Tải ảnh QR (${exportQuality.toUpperCase()})`}
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Row 2: Portfolio Quick Shortcut & Photo Upload Pill */}
          <div className="flex items-center justify-between gap-1.5 px-0.5 sm:px-1 text-[11px]">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => handleQuickPreset('https://btvdev03.github.io/')}
                className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200/80 hover:border-emerald-300 text-[10px] sm:text-xs font-semibold transition-all active:scale-95 shadow-2xs whitespace-nowrap min-w-0"
                title="Nhập URL Portfolio để tạo QR 3D"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform shrink-0" />
                <span className="truncate">Võ Tấn Bản • Portfolio</span>
              </button>
              <a
                href="https://btvdev03.github.io/"
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-500 hover:text-stone-800 border border-stone-200/80 transition-all active:scale-95 shrink-0"
                title="Mở Portfolio Võ Tấn Bản trong tab mới"
              >
                <ExternalLink className="w-3 h-3 text-stone-600" />
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-semibold transition-all active:scale-95 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedStyle === 'photo' || uploadedPhotoUrl
                    ? 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 border-indigo-200/90 hover:border-indigo-300'
                    : 'bg-stone-100 hover:bg-indigo-50 text-stone-700 hover:text-indigo-900 border-stone-200/80 hover:border-indigo-300'
                }`}
                title={
                  uploadedPhotoUrl
                    ? 'Chọn ảnh khác để tạo mã QR 3D'
                    : 'Tải ảnh từ thiết bị để tạo mã QR 3D'
                }
              >
                {uploadedPhotoUrl ? (
                  <>
                    <ImageIcon className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Đổi ảnh khác</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Tải ảnh tạo QR</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[10px] text-stone-400 font-medium hidden sm:inline whitespace-nowrap shrink-0">
              100% Client-side
            </span>
          </div>

          {/* Row 3: 4-Season + Photo Segmented Tab Switcher + Sound Toggle */}
          <div className="flex items-center justify-between gap-0.5 sm:gap-1 p-1 rounded-2xl bg-stone-100/90 border border-stone-200/70 text-[10px] sm:text-xs font-bold">
            {[
              { id: 'spring', label: 'Xuân', icon: 'mai', activeClass: 'bg-amber-100 text-amber-950 border-amber-300/80 shadow-xs ring-1 ring-amber-400/20' },
              { id: 'summer', label: 'Hạ', icon: '☀️', activeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300/80 shadow-xs ring-1 ring-emerald-400/20' },
              { id: 'autumn', label: 'Thu', icon: '🍁', activeClass: 'bg-orange-100 text-orange-950 border-orange-300/80 shadow-xs ring-1 ring-orange-400/20' },
              { id: 'winter', label: 'Đông', icon: '❄️', activeClass: 'bg-sky-100 text-sky-950 border-sky-300/80 shadow-xs ring-1 ring-sky-400/20' },
            ].map((s) => {
              const isSelected = selectedStyle !== 'photo' && selectedSeason === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSeason(s.id as SeasonKey)
                    setSelectedStyle('tree')
                  }}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-1 sm:py-1.5 rounded-xl border border-transparent transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? s.activeClass
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {s.icon === 'mai' ? (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none">
                      <circle cx="12" cy="6.2" r="4.1" fill="#eab308" />
                      <circle cx="17.5" cy="10.2" r="4.1" fill="#facc15" />
                      <circle cx="15.4" cy="16.6" r="4.1" fill="#eab308" />
                      <circle cx="8.6" cy="16.6" r="4.1" fill="#facc15" />
                      <circle cx="6.5" cy="10.2" r="4.1" fill="#eab308" />
                      <circle cx="12" cy="12" r="2.6" fill="#ea580c" />
                      <circle cx="12" cy="12" r="1.2" fill="#fef08a" />
                    </svg>
                  ) : (
                    <span className="text-[11px] sm:text-sm leading-none shrink-0">{s.icon}</span>
                  )}
                  <span className="text-[10px] sm:text-xs">{s.label}</span>
                </button>
              )
            })}

            {/* 5th Style Pill: Photo-to-QR */}
            <button
              type="button"
              onClick={() => {
                if (uploadedPhotoUrl) {
                  setSelectedStyle('photo')
                } else {
                  fileInputRef.current?.click()
                }
              }}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1 sm:px-1.5 py-1 sm:py-1.5 rounded-xl border border-transparent transition-all whitespace-nowrap cursor-pointer ${
                selectedStyle === 'photo'
                  ? 'bg-indigo-100 text-indigo-950 border-indigo-300/80 shadow-xs ring-1 ring-indigo-400/20'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
              title={
                uploadedPhotoUrl
                  ? 'Chuyển sang mã QR từ ảnh của bạn'
                  : 'Tải ảnh lên để tạo mã QR 3D'
              }
            >
              {uploadedPhotoUrl ? (
                <img
                  src={uploadedPhotoUrl}
                  alt="Ảnh đã tải"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover ring-1 ring-black/15 shrink-0"
                />
              ) : (
                <ImagePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              )}
              <span className="text-[10px] sm:text-xs">Ảnh</span>
            </button>

            {/* Sound / Mute Toggle Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-1.5 ml-0.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                isMuted
                  ? 'text-stone-400 hover:text-stone-700 border-transparent hover:bg-white/60'
                  : 'text-emerald-700 bg-white border-emerald-200 shadow-xs'
              }`}
              title={isMuted ? 'Bật âm thanh thiên nhiên' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>
        </div>
      </div>

      {/* 6. SLIDE-OVER SETTINGS DRAWER (Redesigned & Streamlined) */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setShowSettingsDrawer(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white/95 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 border-l border-stone-200/90">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm">Cài Đặt & Tuỳ Chỉnh</h3>
                    <p className="text-[11px] text-stone-500 font-medium">Góc nhìn diorama & xuất ảnh QR</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all font-bold active:scale-95"
                  title="Đóng cài đặt"
                >
                  ✕
                </button>
              </div>

              {/* Setting 1: Interaction & Camera Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Tương Tác & Hiệu Ứng 3D
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    60 FPS
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Auto Rotate Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 transition-all">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                        <span>Tự động xoay 360°</span>
                      </div>
                      <div className="text-[10px] text-stone-500 leading-snug">
                        Quay chậm nhẹ nhàng để ngắm toàn cảnh cây bonsai
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isAutoRotate
                        setIsAutoRotate(next)
                        sceneManagerRef.current?.setAutoRotate(next)
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                        isAutoRotate ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Weather Particles Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 transition-all">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hiệu ứng thời tiết</span>
                      </div>
                      <div className="text-[10px] text-stone-500 leading-snug">
                        Cánh hoa mai, đom đóm hạ, lá phong thu, tuyết Sa Pa
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isWeatherEnabled
                        setIsWeatherEnabled(next)
                        sceneManagerRef.current?.setWeatherEnabled(next)
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                        isWeatherEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Camera Rotation Lock Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 transition-all">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Khóa góc camera chuẩn</span>
                      </div>
                      <div className="text-[10px] text-stone-500 leading-snug">
                        Góc cố định mượt mà 60 FPS, không lệch khi thao tác
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCameraLocked
                        setIsCameraLocked(next)
                        sceneManagerRef.current?.setCameraRotationLock(next)
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                        isCameraLocked ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Setting 2: Export Resolution & Download Actions */}
              <div className="space-y-3 pt-3 border-t border-stone-200/80">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Độ Phân Giải Tải Ảnh
                  </label>
                  <p className="text-[10px] text-stone-500 font-medium">Xuất ảnh PNG siêu nét để in ấn hoặc chia sẻ</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '1080p', label: '1080p', desc: '1920×1920' },
                    { id: '2k', label: '2K QHD', desc: '2560×2560' },
                    { id: '4k', label: '4K Ultra', desc: '3840×3840' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setExportQuality(res.id as '1080p' | '2k' | '4k')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        exportQuality === res.id
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 font-extrabold ring-1 ring-emerald-500/30 shadow-2xs'
                          : 'border-stone-200/80 hover:bg-stone-50 text-stone-700 font-semibold'
                      }`}
                    >
                      <div className="text-xs">{res.label}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{res.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExport(true)}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Mã QR Quét Chuẩn 90° ({exportQuality.toUpperCase()})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport(false)}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-stone-300" />
                    <span>Tải Ảnh Khối 3D ({exportQuality.toUpperCase()})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer & Credits */}
            <div className="pt-4 border-t border-stone-200/80 space-y-2">
              <div className="p-3 rounded-2xl bg-stone-50/80 border border-stone-200/70 text-center space-y-1">
                <div className="text-xs font-black text-stone-900">SeasonQR</div>
                <div className="text-[10px] text-stone-500">
                  Mã QR 3D Nghệ Thuật 4 Mùa Việt Nam • 100% Client-side
                </div>
                <div className="pt-1 text-[11px] text-stone-700">
                  Tác giả:{' '}
                  <a
                    href="https://btvdev03.github.io/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-extrabold hover:text-emerald-800 underline underline-offset-2"
                  >
                    Võ Tấn Bản (btvdev03)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
