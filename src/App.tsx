import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { SeasonKey, StyleKey, ViewMode, QRContentType } from './types'
import {
  resolveSeason,
  getAutoSeason,
  STYLES,
  getStyleSubThemes,
  createPresetPhotoDataUrl,
  type ArtPresetId,
} from './utils/seasonUtils'
import { SceneManager } from './engine/SceneManager'
import { soundEngine } from './utils/audioAmbiance'
import {
  Sparkles,
  RotateCcw,
  RotateCw,
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
  Wifi,
  UserRound,
  MessageSquareText,
  Share2,
  Check,
  Copy,
  Layers,
} from 'lucide-react'
import {
  recordQRGeneration,
  fetchGlobalQRCount,
  getCachedGlobalCount,
  formatCount,
} from './utils/qrCounter'

const VALID_STYLES: StyleKey[] = [
  'tree',
  'cyber',
  'zen',
  'island',
  'crystal',
  'brick',
  'photo',
]

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const styleCarouselRef = useRef<HTMLDivElement>(null)

  // Core App State
  const [url, setUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const u = new URLSearchParams(window.location.search).get('url')
      if (u && u.trim()) return u.trim()
    }
    return 'https://btvdev03.github.io/season-qr/'
  })
  const [inputUrl, setInputUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const u = new URLSearchParams(window.location.search).get('url')
      if (u && u.trim()) return u.trim()
    }
    return 'https://btvdev03.github.io/season-qr/'
  })
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('season')
      if (p === 'spring' || p === 'summer' || p === 'autumn' || p === 'winter')
        return p
    }
    return getAutoSeason()
  })
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('style') as StyleKey | null
      if (s && VALID_STYLES.includes(s)) return s
    }
    return 'tree'
  })
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [activeArtPreset, setActiveArtPreset] = useState<ArtPresetId | null>(null)
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
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Smart QR Template Builder State
  const [qrContentType, setQrContentType] = useState<QRContentType>('url')
  const [wifiSsid, setWifiSsid] = useState<string>('')
  const [wifiPassword, setWifiPassword] = useState<string>('')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [contactName, setContactName] = useState<string>('')
  const [contactPhone, setContactPhone] = useState<string>('')
  const [contactEmail, setContactEmail] = useState<string>('')
  const [contactUrl, setContactUrl] = useState<string>('https://btvdev03.github.io/')
  const [customText, setCustomText] = useState<string>('')

  // Live QR Creation Counter State
  const [globalQRCount, setGlobalQRCount] = useState<number | null>(() =>
    getCachedGlobalCount()
  )

  // Interactive Settings State
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false)
  const [isWeatherEnabled, setIsWeatherEnabled] = useState<boolean>(true)
  const [isCameraLocked, setIsCameraLocked] = useState<boolean>(true)
  const [exportQuality, setExportQuality] = useState<'1080p' | '2k' | '4k'>('1080p')

  const actualSeason = resolveSeason(selectedSeason)
  const activeStyleMeta =
    STYLES.find((st) => st.id === selectedStyle) || STYLES[0]
  const styleSubThemes = getStyleSubThemes(selectedStyle)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 2800)
  }

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
    ;(window as unknown as { __sceneManager: SceneManager }).__sceneManager = manager
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
      sceneManagerRef.current.updateScene(
        url,
        actualSeason,
        selectedStyle,
        uploadedPhotoUrl
      )
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

  // Auto-scroll active style pill into view on mobile carousel
  useEffect(() => {
    if (!styleCarouselRef.current) return
    const activeBtn = styleCarouselRef.current.querySelector<HTMLElement>(
      `[data-style-id="${selectedStyle}"]`
    )
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [selectedStyle])

  const toggleSound = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    soundEngine.setMuted(nextMuted, actualSeason)
  }

  const toggleAutoRotate = () => {
    const next = !isAutoRotate
    setIsAutoRotate(next)
    sceneManagerRef.current?.setAutoRotate(next)
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
        setActiveArtPreset(null)
        setUploadedPhotoUrl(dataUrl)
        setSelectedStyle('photo')
        showToast('Đã tạo khối điêu khắc QR 3D từ ảnh của bạn!')
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

  const handleSelectArtPreset = (presetId: ArtPresetId) => {
    const dataUrl = createPresetPhotoDataUrl(presetId)
    if (dataUrl) {
      setActiveArtPreset(presetId)
      setUploadedPhotoUrl(dataUrl)
      setSelectedStyle('photo')
      recordQRGeneration().then(({ globalCount }) => {
        setGlobalQRCount(globalCount)
      })
    }
  }

  // Apply new QR payload and increment global counter
  const applyNewQRContent = (newContent: string, labelToast?: string) => {
    const trimmed = newContent.trim()
    if (!trimmed) return
    setInputUrl(trimmed)
    if (trimmed !== url) {
      setUrl(trimmed)
      recordQRGeneration().then(({ globalCount }) => {
        setGlobalQRCount(globalCount)
      })
    }
    if (labelToast) {
      showToast(labelToast)
    }
  }

  // URL Submit handler
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputUrl.trim()
    if (!trimmed) {
      setInputUrl(url)
      return
    }
    if (trimmed !== url) {
      setUrl(trimmed)
      showToast('Đã cập nhật mã QR 3D mới!')
      recordQRGeneration().then(({ globalCount }) => {
        setGlobalQRCount(globalCount)
      })
    }
  }

  const handleQuickPreset = (presetUrl: string) => {
    applyNewQRContent(presetUrl, 'Đã áp dụng link mẫu vào mã QR 3D!')
  }

  // Escapes special delimiters (\, ;, :, ,) for ZXing WIFI: and MECARD: QR formats
  const escapeQRField = (val: string) => val.replace(/([\\;,:])/g, '\\$1')

  // Smart Template Builder Submit
  const handleTemplateApply = (e: React.FormEvent) => {
    e.preventDefault()
    let payload = ''
    let toast = 'Đã tạo mã QR 3D thành công!'

    if (qrContentType === 'url') {
      const candidate = inputUrl.trim()
      payload =
        candidate &&
        !candidate.startsWith('WIFI:') &&
        !candidate.startsWith('MECARD:')
          ? candidate
          : 'https://btvdev03.github.io/'
      toast = 'Đã tạo mã QR Link / Website!'
    } else if (qrContentType === 'wifi') {
      const rawSsid = wifiSsid.trim() || 'SeasonQR_WiFi'
      const ssid = escapeQRField(rawSsid)
      const pass =
        wifiEncryption === 'nopass' ? '' : escapeQRField(wifiPassword.trim())
      payload = `WIFI:T:${wifiEncryption};S:${ssid};P:${pass};;`
      toast = `Đã tạo mã QR Wi-Fi "${rawSsid}"!`
    } else if (qrContentType === 'contact') {
      const rawName = contactName.trim() || 'Võ Tấn Bản'
      const name = escapeQRField(rawName)
      const tel = escapeQRField(contactPhone.trim())
      const email = escapeQRField(contactEmail.trim())
      const web = contactUrl.trim().replace(/([\\;,])/g, '\\$1')
      payload = `MECARD:N:${name};${tel ? `TEL:${tel};` : ''}${
        email ? `EMAIL:${email};` : ''
      }${web ? `URL:${web};` : ''};`
      toast = `Đã tạo mã QR Danh thiếp "${rawName}"!`
    } else if (qrContentType === 'text') {
      payload = customText.trim() || 'Chúc bạn một ngày tràn đầy năng lượng!'
      toast = 'Đã tạo mã QR Lời nhắn / Văn bản!'
    }

    applyNewQRContent(payload, toast)
    setShowTemplateModal(false)
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

      const themeTag =
        selectedStyle === 'photo'
          ? 'photo'
          : `${selectedStyle}-${actualSeason}`
      const downloadLink = document.createElement('a')
      downloadLink.download = `SeasonQR-${themeTag}-${
        topDown ? 'scan90' : '3d'
      }-${exportQuality}-${Date.now()}.png`
      downloadLink.href = dataUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      showToast(
        topDown
          ? `Đã tải mã QR quét chuẩn 90° (${exportQuality.toUpperCase()})!`
          : `Đã tải ảnh khối 3D (${exportQuality.toUpperCase()})!`
      )

      confetti({
        particleCount: 55,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22c55e', '#38bdf8', '#facc15'],
      })
    } catch (err) {
      console.error('Export failed:', err)
      showToast('Không thể xuất ảnh, vui lòng thử lại.')
    } finally {
      setIsExporting(false)
    }
  }

  // Copy QR Image or Shareable Link to Clipboard
  const handleCopyQRImage = async () => {
    if (!sceneManagerRef.current || isExporting) return
    try {
      const dataUrl = await sceneManagerRef.current.exportSnapshot({
        width: 1400,
        height: 1400,
        topDown: viewMode === 'topDown',
      })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        showToast('Đã sao chép ảnh mã QR vào bộ nhớ tạm (Clipboard)!')
        return
      }
    } catch {
      // Fallback to share link below
    }
    handleShareLink()
  }

  const handleShareLink = async () => {
    try {
      const shareUrl = new URL(window.location.href)
      shareUrl.searchParams.set('style', selectedStyle)
      shareUrl.searchParams.set('season', actualSeason)
      shareUrl.searchParams.set('url', url)
      await navigator.clipboard.writeText(shareUrl.toString())
      showToast('Đã sao chép đường dẫn chia sẻ mã QR 3D!')
    } catch {
      showToast('Đã sẵn sàng chia sẻ mã QR 3D!')
    }
  }

  // Dynamic background styling (ALWAYS pure crisp white #ffffff in 90° scan mode)
  const getSeasonBackgroundClass = () => {
    if (viewMode === 'topDown') {
      return 'from-white via-white to-white'
    }
    if (selectedStyle === 'photo') {
      return 'from-[#f8fafc] via-[#f4f6f9] to-[#e9eef5]'
    }
    if (selectedStyle === 'cyber') {
      return 'from-[#f8fafc] via-[#eef2ff] to-[#e0e7ff]'
    }
    if (selectedStyle === 'crystal') {
      return 'from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff]/55'
    }
    if (selectedStyle === 'brick') {
      return 'from-[#fffdf9] via-[#fef9c3]/35 to-[#e0f2fe]/45'
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

  // Luminous radial aura positioned behind the 3D diorama (transparent in 90° scan mode)
  const getSeasonAuraGradient = () => {
    if (viewMode === 'topDown') {
      return 'transparent'
    }
    if (selectedStyle === 'photo') {
      return 'radial-gradient(circle at 50% 45%, rgba(148, 163, 184, 0.22) 0%, rgba(226, 232, 240, 0.42) 32%, transparent 68%)'
    }
    if (selectedStyle === 'cyber') {
      return 'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.24) 0%, rgba(168, 85, 247, 0.22) 34%, transparent 68%)'
    }
    if (selectedStyle === 'crystal') {
      return 'radial-gradient(circle at 50% 45%, rgba(168, 85, 247, 0.22) 0%, rgba(192, 132, 252, 0.28) 32%, transparent 68%)'
    }
    if (selectedStyle === 'brick') {
      return 'radial-gradient(circle at 50% 45%, rgba(250, 204, 21, 0.22) 0%, rgba(56, 189, 248, 0.22) 34%, transparent 68%)'
    }
    switch (actualSeason) {
      case 'spring':
        return 'radial-gradient(circle at 50% 45%, rgba(234, 179, 8, 0.22) 0%, rgba(254, 240, 138, 0.35) 30%, transparent 68%)'
      case 'autumn':
        return 'radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.22) 0%, rgba(253, 230, 138, 0.35) 30%, transparent 68%)'
      case 'winter':
        return 'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.22) 0%, rgba(224, 242, 254, 0.4) 30%, transparent 68%)'
      case 'summer':
      default:
        return 'radial-gradient(circle at 50% 45%, rgba(74, 222, 128, 0.24) 0%, rgba(187, 247, 208, 0.35) 30%, transparent 68%)'
    }
  }

  const getPerspectivePromptText = () => {
    if (viewMode === 'isometric') {
      switch (selectedStyle) {
        case 'photo':
          return 'Chạm ảnh để biến thành mã QR (Góc 90°)'
        case 'cyber':
          return 'Chạm thành phố để nén thành mã QR (90°)'
        case 'zen':
          return 'Chạm chùa tháp để xem mã QR (Góc 90°)'
        case 'island':
          return 'Chạm đảo bay để xem mã QR (Góc 90°)'
        case 'crystal':
          return 'Chạm tinh thể để kết tinh mã QR (90°)'
        case 'brick':
          return 'Chạm khối Lego để ghép mã QR (90°)'
        case 'tree':
        default:
          return 'Chạm cây để xem mã QR (Góc 90°)'
      }
    } else {
      switch (selectedStyle) {
        case 'photo':
          return 'Chạm để quay lại khối ảnh 3D'
        case 'cyber':
          return 'Chạm để xem Thành Phố Cyberpunk 3D'
        case 'zen':
          return 'Chạm để xem Chùa Tháp & Vườn Thiền 3D'
        case 'island':
          return 'Chạm để xem Đảo Bay Kỳ Ảo 3D'
        case 'crystal':
          return 'Chạm để xem Tinh Thể Pha Lê 3D'
        case 'brick':
          return 'Chạm để xem Thế Giới Lego 3D'
        case 'tree':
        default:
          return 'Chạm để xem cây Bonsai 3D'
      }
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

      {/* FLOATING TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-16 sm:top-20 inset-x-0 mx-auto w-fit max-w-[90vw] z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/95 text-white text-xs font-bold shadow-xl border border-white/15 backdrop-blur-md">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. DISTINCTIVE RESPONSIVE HEADER */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5 pointer-events-none gap-2">
        {/* Brand Logo & Global Creation Counter */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md border border-stone-700/30 shrink-0">
            {activeStyleMeta.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-stone-900 text-base sm:text-lg tracking-tight shrink-0">
                SeasonQR
              </span>

              {/* Active Style Badge (Desktop/Tablet) */}
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900/8 text-stone-800 border border-stone-300/80">
                {activeStyleMeta.name}
              </span>

              {/* Global QR Creation Counter Badge */}
              <div
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-950 border border-amber-300/80 shadow-2xs whitespace-nowrap shrink-0"
                title="Tổng số lượt mã QR đã tạo toàn cầu"
              >
                <span className="text-[11px] text-amber-600 font-black">⚡</span>
                <span className="hidden sm:inline">
                  {formatCount(globalQRCount)} lượt tạo
                </span>
                <span className="sm:hidden">
                  {formatCount(globalQRCount, true)} tạo
                </span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 font-medium hidden sm:block truncate">
              Studio Tạo Mã QR 3D Đa Phong Cách • 7 Thế Giới 3D • 100% Client-side
            </div>
          </div>
        </div>

        {/* Top Right Actions: Smart QR Builder, Share, Settings & Portfolio */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl bg-white/90 hover:bg-white text-stone-800 hover:text-stone-900 border border-stone-200/90 shadow-xs text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Tạo QR nâng cao: Link, Wi-Fi, Danh thiếp, Lời chúc"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Tạo QR Đa Năng</span>
          </button>

          <button
            type="button"
            onClick={handleCopyQRImage}
            className="p-2 sm:p-2.5 rounded-xl bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Sao chép ảnh mã QR hoặc link chia sẻ"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="p-2 sm:p-2.5 rounded-xl bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/90 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cài đặt & Tùy chọn xuất ảnh 4K"
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
        title={getPerspectivePromptText()}
      />

      {/* 3. FIXED CAMERA & PERFORMANCE BADGE (Bottom Left) */}
      <div className="fixed bottom-5 left-5 z-20 pointer-events-none hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-stone-200/80 text-[11px] text-stone-700 shadow-sm font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>7 Phong cách 3D • Quét 90° siêu tốc 60 FPS</span>
      </div>

      {/* 4. FLOATING PERSPECTIVE HINT PILL & QUICK 360° ROTATE */}
      <div className="fixed bottom-[max(190px,calc(178px+env(safe-area-inset-bottom,0px)))] sm:bottom-[204px] inset-x-0 mx-auto w-fit max-w-[94vw] z-20 pointer-events-auto flex items-center gap-1.5 transition-all duration-300">
        <button
          type="button"
          onClick={() => {
            const nextMode = viewMode === 'isometric' ? 'topDown' : 'isometric'
            setViewMode(nextMode)
            soundEngine.playMorphSound(nextMode === 'topDown')
          }}
          className="group flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 hover:bg-white text-stone-800 shadow-lg hover:shadow-xl border border-stone-200/90 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer"
        >
          {viewMode === 'isometric' ? (
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="truncate">{getPerspectivePromptText()}</span>
        </button>

        {viewMode === 'isometric' && (
          <button
            type="button"
            onClick={toggleAutoRotate}
            className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 active:scale-95 text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer ${
              isAutoRotate
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/95 hover:bg-white text-stone-700 border-stone-200/90'
            }`}
            title="Bật/tắt tự động xoay 360°"
          >
            <RotateCw
              className={`w-3.5 h-3.5 shrink-0 ${
                isAutoRotate ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">360°</span>
          </button>
        )}
      </div>

      {/* 5. LUXURY FLOATING ISLAND COMMAND DOCK (3 RESPONSIVE ROWS) */}
      <div className="fixed bottom-2 sm:bottom-4 inset-x-0 mx-auto z-20 w-full max-w-md sm:max-w-2xl px-2 sm:px-4 pointer-events-auto pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
        <div className="w-full bg-white/90 backdrop-blur-2xl rounded-3xl p-2 sm:p-2.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.14)] border border-white/85 ring-1 ring-stone-900/5 flex flex-col gap-1.5 sm:gap-2 transition-all">
          {/* Row 1: Smart Content Trigger + URL Input + 90° Scan Toggle + Download */}
          <form
            onSubmit={handleUrlSubmit}
            className="flex items-center gap-1 sm:gap-1.5 bg-stone-100/85 focus-within:bg-white rounded-2xl p-1 sm:p-1.5 border border-stone-200/80 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-2xs min-w-0"
          >
            {/* Quick QR Content Type Button */}
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200/80 text-[10px] sm:text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Chọn loại mã QR: Link, Wi-Fi, Danh thiếp, Lời nhắn"
            >
              {url.startsWith('WIFI:') ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              ) : url.startsWith('MECARD:') ? (
                <UserRound className="w-3.5 h-3.5 text-indigo-600" />
              ) : url.startsWith('http') ? (
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <MessageSquareText className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className="hidden sm:inline">Loại QR</span>
            </button>

            <input
              ref={urlInputRef}
              type="text"
              size={1}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onBlur={() => handleUrlSubmit()}
              placeholder="Nhập link, văn bản, Wi-Fi..."
              className="w-full flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none font-semibold truncate px-1"
            />

            {/* Clear Input Button */}
            {inputUrl && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setInputUrl('')
                  urlInputRef.current?.focus()
                }}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/60 transition-colors shrink-0 cursor-pointer"
                title="Xóa nội dung"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Quick Action 1: 3D <-> Scan 90deg Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextMode =
                  viewMode === 'isometric' ? 'topDown' : 'isometric'
                setViewMode(nextMode)
                soundEngine.playMorphSound(nextMode === 'topDown')
              }}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer ${
                viewMode === 'topDown'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-800 hover:text-stone-900 border border-stone-200/90 shadow-2xs'
              }`}
              title={
                viewMode === 'isometric'
                  ? 'Chuyển sang góc quét QR 90°'
                  : 'Quay lại góc nhìn 3D Isometric'
              }
            >
              {viewMode === 'isometric' ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Quét 90°</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xem 3D</span>
                </>
              )}
            </button>

            {/* Quick Action 2: HD Snapshot Export */}
            <button
              type="button"
              onClick={() => handleExport(viewMode === 'topDown')}
              disabled={isExporting}
              className="p-1.5 sm:p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all active:scale-95 shrink-0 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              title={`Tải ảnh QR PNG (${exportQuality.toUpperCase()})`}
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Row 2: 7-Style 3D World Carousel Switcher */}
          <div
            ref={styleCarouselRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY
              }
            }}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5"
          >
            {STYLES.map((st) => {
              const isSelected = selectedStyle === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  data-style-id={st.id}
                  onClick={() => {
                    if (st.id === 'photo' && !uploadedPhotoUrl) {
                      handleSelectArtPreset('lotus')
                    } else {
                      setSelectedStyle(st.id)
                    }
                  }}
                  className={`flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-700 border-stone-200/80'
                  }`}
                  title={st.description}
                >
                  <span className="text-xs sm:text-sm leading-none shrink-0">
                    {st.icon}
                  </span>
                  <span>{st.shortName}</span>
                </button>
              )
            })}
          </div>

          {/* Row 3: Context-Aware Sub-Theme / Season / Photo Controls + Portfolio + Sound */}
          <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-stone-100/90 border border-stone-200/70 text-[10px] sm:text-xs font-bold">
            {selectedStyle !== 'photo' ? (
              <>
                {styleSubThemes.map((s) => {
                  const isSelected = actualSeason === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSeason(s.id)}
                      className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 py-1 sm:py-1.5 rounded-xl border border-transparent transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? s.activeClass
                          : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                      }`}
                    >
                      {s.icon === 'mai' ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0"
                          fill="none"
                        >
                          <circle cx="12" cy="6.2" r="4.1" fill="#eab308" />
                          <circle cx="17.5" cy="10.2" r="4.1" fill="#facc15" />
                          <circle cx="15.4" cy="16.6" r="4.1" fill="#eab308" />
                          <circle cx="8.6" cy="16.6" r="4.1" fill="#facc15" />
                          <circle cx="6.5" cy="10.2" r="4.1" fill="#eab308" />
                          <circle cx="12" cy="12" r="2.6" fill="#ea580c" />
                          <circle cx="12" cy="12" r="1.2" fill="#fef08a" />
                        </svg>
                      ) : (
                        <span className="text-[11px] sm:text-xs leading-none shrink-0">
                          {s.icon}
                        </span>
                      )}
                      <span className="truncate">{s.label}</span>
                    </button>
                  )
                })}

                {/* Quick Photo Upload Button (Accessible on both mobile and desktop) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-xl text-stone-600 hover:text-indigo-900 hover:bg-indigo-50/80 transition-all whitespace-nowrap cursor-pointer shrink-0"
                  title="Tải ảnh của bạn lên để tạo QR Điêu Khắc 3D"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">Tải ảnh</span>
                </button>
              </>
            ) : (
              /* Photo Mode Controls: Upload Custom Photo + 3 Built-in Artistic Presets */
              <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all whitespace-nowrap cursor-pointer shrink-0"
                  title="Tải ảnh từ thiết bị của bạn"
                >
                  {uploadedPhotoUrl && !activeArtPreset ? (
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {uploadedPhotoUrl && !activeArtPreset
                      ? 'Đổi ảnh khác'
                      : 'Tải ảnh từ máy'}
                  </span>
                </button>

                {[
                  { id: 'lotus' as ArtPresetId, label: 'Sen Vàng', icon: '🪷' },
                  { id: 'galaxy' as ArtPresetId, label: 'Ngân Hà', icon: '🌌' },
                  { id: 'hoian' as ArtPresetId, label: 'Hội An', icon: '🏮' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectArtPreset(preset.id)}
                    className={`flex-1 min-w-fit flex items-center justify-center gap-1 px-2 py-1 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                      activeArtPreset === preset.id
                        ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/70 border-transparent'
                    }`}
                    title={`Mẫu tranh nghệ thuật: ${preset.label}`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sound / Mute Toggle Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                isMuted
                  ? 'text-stone-400 hover:text-stone-700 border-transparent hover:bg-white/60'
                  : 'text-emerald-700 bg-white border-emerald-200 shadow-xs'
              }`}
              title={isMuted ? 'Bật âm thanh thiên nhiên' : 'Tắt âm thanh'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 6. SMART MULTI-PURPOSE QR CONTENT BUILDER MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setShowTemplateModal(false)}
          />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200/90 p-5 sm:p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 font-bold">
                  ✨
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    Trình Tạo Nội Dung QR Đa Năng
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Hỗ trợ Website, Wi-Fi tự động, Danh thiếp & Lời chúc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Type Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-stone-100 border border-stone-200/70 text-xs font-bold">
              {[
                { id: 'url' as QRContentType, label: 'Link Web', icon: Link2 },
                { id: 'wifi' as QRContentType, label: 'Wi-Fi', icon: Wifi },
                {
                  id: 'contact' as QRContentType,
                  label: 'Danh Thiếp',
                  icon: UserRound,
                },
                {
                  id: 'text' as QRContentType,
                  label: 'Lời Nhắn',
                  icon: MessageSquareText,
                },
              ].map((tab) => {
                const Icon = tab.icon
                const active = qrContentType === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setQrContentType(tab.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] sm:text-[11px]">
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Dynamic Form Fields */}
            <form onSubmit={handleTemplateApply} className="space-y-3.5">
              {qrContentType === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Đường dẫn Website / Mạng xã hội
                    </label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-500">
                      Link mẫu thử nhanh:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          label: 'Portfolio Võ Tấn Bản',
                          url: 'https://btvdev03.github.io/',
                        },
                        {
                          label: 'SeasonQR Live',
                          url: 'https://btvdev03.github.io/season-qr/',
                        },
                        { label: 'GitHub', url: 'https://github.com/btvdev03' },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setInputUrl(p.url)}
                          className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {qrContentType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tên mạng Wi-Fi (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="Ví dụ: Coffee_Highland_5G"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Mật khẩu Wi-Fi
                      </label>
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        disabled={wifiEncryption === 'nopass'}
                        placeholder={
                          wifiEncryption === 'nopass'
                            ? 'Không cần mật khẩu'
                            : 'Nhập mật khẩu...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Bảo mật
                      </label>
                      <select
                        value={wifiEncryption}
                        onChange={(e) =>
                          setWifiEncryption(
                            e.target.value as 'WPA' | 'WEP' | 'nopass'
                          )
                        }
                        className="w-full px-2.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Mở (Free)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {qrContentType === 'contact' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Võ Tấn Bản"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@example.com"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        value={contactUrl}
                        onChange={(e) => setContactUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {qrContentType === 'text' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Lời nhắn / Thông điệp
                    </label>
                    <textarea
                      rows={3}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Nhập lời chúc hoặc thông điệp bí mật..."
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Chúc Mừng Năm Mới An Khang Thịnh Vượng!',
                      'Cảm ơn bạn đã ghé thăm!',
                      'Welcome to SeasonQR 3D Studio!',
                    ].map((msg) => (
                      <button
                        key={msg}
                        type="button"
                        onClick={() => setCustomText(msg)}
                        className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-amber-50 text-stone-700 border border-stone-200 text-[10px] font-semibold cursor-pointer"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Tạo Mã QR 3D Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SLIDE-OVER SETTINGS & STUDIO DRAWER */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setShowSettingsDrawer(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto z-10 border-l border-stone-200/90">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm">
                      Studio & Cài Đặt 3D
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Phong cách 3D, góc nhìn & xuất ảnh 4K
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all font-bold active:scale-95 cursor-pointer"
                  title="Đóng cài đặt"
                >
                  ✕
                </button>
              </div>

              {/* Section 1: 7 3D Styles Quick Gallery */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>7 Phong Cách Kiến Trúc 3D</span>
                  </label>
                  <span className="text-[10px] text-stone-500 font-semibold">
                    {activeStyleMeta.tag}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLES.map((st) => {
                    const active = selectedStyle === st.id
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          if (st.id === 'photo' && !uploadedPhotoUrl) {
                            handleSelectArtPreset('lotus')
                          } else {
                            setSelectedStyle(st.id)
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/80'
                        }`}
                      >
                        <span className="text-base shrink-0">{st.icon}</span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate">
                            {st.shortName}
                          </div>
                          <div
                            className={`text-[9px] truncate ${
                              active ? 'text-stone-300' : 'text-stone-500'
                            }`}
                          >
                            {st.tag}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 2: Interaction & Camera Controls */}
              <div className="space-y-2.5 pt-3 border-t border-stone-200/80">
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
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 transition-all">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-stone-500" />
                        <span>Tự động xoay 360°</span>
                      </div>
                      <div className="text-[10px] text-stone-500 leading-snug">
                        Quay bàn xoay 360° ngắm toàn cảnh mô hình 3D
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAutoRotate}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
                        isAutoRotate
                          ? 'bg-emerald-600 justify-end'
                          : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Weather Particles Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 transition-all">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hạt khí quyển & Thời tiết</span>
                      </div>
                      <div className="text-[10px] text-stone-500 leading-snug">
                        Hoa mai, đom đóm, lá thu, tuyết rơi theo chủ đề
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isWeatherEnabled
                        setIsWeatherEnabled(next)
                        sceneManagerRef.current?.setWeatherEnabled(next)
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
                        isWeatherEnabled
                          ? 'bg-emerald-600 justify-end'
                          : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Camera Rotation Lock Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50/80 hover:bg-stone-50 border border-stone-200/70 transition-all">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Khóa góc camera chuẩn</span>
                      </div>
                      <div className="text-[10px] text-stone-500 leading-snug">
                        Tắt để tự do kéo chuột xoay & thu phóng góc 3D
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCameraLocked
                        setIsCameraLocked(next)
                        sceneManagerRef.current?.setCameraRotationLock(next)
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
                        isCameraLocked
                          ? 'bg-emerald-600 justify-end'
                          : 'bg-stone-300 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Export Resolution & Download Actions */}
              <div className="space-y-2.5 pt-3 border-t border-stone-200/80">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Xuất Ảnh PNG Ultra HD & Chia Sẻ
                  </label>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Tải ảnh nét cao để in ấn, làm poster hoặc chia sẻ
                  </p>
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
                      onClick={() =>
                        setExportQuality(res.id as '1080p' | '2k' | '4k')
                      }
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        exportQuality === res.id
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 font-extrabold ring-1 ring-emerald-500/30 shadow-2xs'
                          : 'border-stone-200/80 hover:bg-stone-50 text-stone-700 font-semibold'
                      }`}
                    >
                      <div className="text-xs">{res.label}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        {res.desc}
                      </div>
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
                    <span>
                      Tải Mã QR Quét Chuẩn 90° ({exportQuality.toUpperCase()})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport(false)}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-stone-300" />
                    <span>
                      Tải Ảnh Mô Hình 3D ({exportQuality.toUpperCase()})
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyQRImage}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                      <span>Copy Ảnh QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareLink}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-stone-600" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer & Credits */}
            <div className="pt-4 border-t border-stone-200/80 space-y-2 mt-4">
              <div className="p-3 rounded-2xl bg-stone-50/80 border border-stone-200/70 text-center space-y-1">
                <div className="text-xs font-black text-stone-900">
                  SeasonQR 3D Studio
                </div>
                <div className="text-[10px] text-stone-500">
                  7 Phong Cách Kiến Trúc QR 3D • 100% Client-side
                </div>
                <div className="pt-1 text-[11px] text-stone-700">
                  Tác giả:{' '}
                  <a
                    href="https://btvdev03.github.io/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleQuickPreset('https://btvdev03.github.io/')}
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
