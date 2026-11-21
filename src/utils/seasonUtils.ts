import type { ActualSeason, SeasonInfo, StyleInfo, SeasonKey, StyleKey } from '../types'

export function getAutoSeason(): ActualSeason {
  const month = new Date().getMonth() + 1 // 1 - 12
  // Vietnam 4 seasons:
  // Xuân (Spring - Tết Mai Vàng): Tháng 2, 3, 4
  // Hạ (Summer - Nắng hè phượng vĩ): Tháng 5, 6, 7
  // Thu (Autumn - Mùa thu cúc vàng): Tháng 8, 9, 10
  // Đông (Winter - Sa Pa mùa đông rét): Tháng 11, 12, 1
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function resolveSeason(seasonKey: SeasonKey): ActualSeason {
  if (seasonKey === 'auto') {
    return getAutoSeason()
  }
  return seasonKey
}

export const SEASONS: SeasonInfo[] = [
  {
    id: 'auto',
    name: 'Tự Động (Theo tháng)',
    emoji: '⏳',
    description: 'Tự nhận diện mùa hiện tại theo thời gian thực tại Việt Nam',
    color: '#6366f1',
    accentColor: 'indigo',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'spring',
    name: 'Xuân Mai Vàng',
    emoji: '🌼',
    description: 'Sắc mai vàng rực rỡ phương Nam đón Tết cổ truyền, mang tài lộc và phú quý',
    color: '#eab308',
    accentColor: 'amber',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'summer',
    name: 'Hạ Phượng Vĩ',
    emoji: '☀️',
    description: 'Nắng hè nhiệt đới, sắc phượng vĩ rực rỡ và đầm sen ngát hương',
    color: '#fbbf24',
    accentColor: 'amber',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'autumn',
    name: 'Thu Cúc Vàng',
    emoji: '🍁',
    description: 'Gió heo may se lạnh, hương hoa sữa nồng nàn và cúc vàng rực rỡ',
    color: '#fb923c',
    accentColor: 'orange',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  {
    id: 'winter',
    name: 'Đông Sa Pa',
    emoji: '❄️',
    description: 'Sương mây bảng lảng đỉnh Fansipan, tuyết trắng miền cao Tây Bắc',
    color: '#38bdf8',
    accentColor: 'sky',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
]

export const STYLES: StyleInfo[] = [
  {
    id: 'tree',
    name: 'Cây Bonsai 4 Mùa',
    shortName: 'Bonsai 4 Mùa',
    icon: '🌳',
    description: 'Cây cổ thụ biến hình tán lá 4 mùa Việt Nam, thảm cỏ hoa và rêu phong ôm gốc rễ',
    tag: 'Biểu tượng',
  },
  {
    id: 'cyber',
    name: 'Thành Phố Cyberpunk',
    shortName: 'Cyberpunk',
    icon: '🌆',
    description: 'Đô thị tương lai 3D với những tòa tháp dữ liệu đèn neon và vòng năng lượng hologram',
    tag: 'Tương lai',
  },
  {
    id: 'zen',
    name: 'Chùa Tháp & Vườn Thiền',
    shortName: 'Chùa Tháp',
    icon: '⛩️',
    description: 'Tháp Chùa Á Đông 5 tầng cổ kính kết hợp hòn non bộ, cổng Tam Quan và đèn đá',
    tag: 'Di sản',
  },
  {
    id: 'island',
    name: 'Đảo Bay Kỳ Ảo',
    shortName: 'Đảo Bay',
    icon: '🏝️',
    description: 'Kỳ quan đảo nổi bồng bềnh giữa tầng mây với nhũ đá kỳ vĩ và thác nước ngọc bích',
    tag: 'Kỳ ảo',
  },
  {
    id: 'crystal',
    name: 'Tinh Thể Pha Lê',
    shortName: 'Pha Lê',
    icon: '💎',
    description: 'Thánh địa đá quý pha lê lơ lửng kỳ diệu với cụm tinh thể đa diện và vòng thiên văn',
    tag: 'Huyền bí',
  },
  {
    id: 'brick',
    name: 'Thế Giới Lego 3D',
    shortName: 'Lego 3D',
    icon: '🧱',
    description: 'Thế giới gạch lắp ráp Lego 3D sống động với từng viên gạch nổi khối và lâu đài trung tâm',
    tag: 'Sáng tạo',
  },
  {
    id: 'photo',
    name: 'Điêu Khắc Ảnh 3D',
    shortName: 'Ảnh 3D',
    icon: '🖼️',
    description: 'Biến bức ảnh bất kỳ thành tác phẩm điêu khắc voxel 3D và mã QR Halftone nghệ thuật',
    tag: 'Cá nhân hóa',
  },
]

export interface SubThemeOption {
  id: ActualSeason
  label: string
  icon: string
  activeClass: string
}

/**
 * Returns context-aware sub-theme pills for each 3D style
 */
export function getStyleSubThemes(style: StyleKey): SubThemeOption[] {
  switch (style) {
    case 'cyber':
      return [
        {
          id: 'spring',
          label: 'Hoàng Kim',
          icon: '⚡',
          activeClass: 'bg-amber-100 text-amber-950 border-amber-300/90 shadow-xs ring-1 ring-amber-400/25',
        },
        {
          id: 'summer',
          label: 'Ma Trận',
          icon: '🟢',
          activeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300/90 shadow-xs ring-1 ring-emerald-400/25',
        },
        {
          id: 'autumn',
          label: 'Synthwave',
          icon: '🟣',
          activeClass: 'bg-pink-100 text-pink-950 border-pink-300/90 shadow-xs ring-1 ring-pink-400/25',
        },
        {
          id: 'winter',
          label: 'Băng Neon',
          icon: '💠',
          activeClass: 'bg-cyan-100 text-cyan-950 border-cyan-300/90 shadow-xs ring-1 ring-cyan-400/25',
        },
      ]
    case 'crystal':
      return [
        {
          id: 'spring',
          label: 'Hoàng Ngọc',
          icon: '🌼',
          activeClass: 'bg-amber-100 text-amber-950 border-amber-300/90 shadow-xs ring-1 ring-amber-400/25',
        },
        {
          id: 'summer',
          label: 'Lục Bảo',
          icon: '💚',
          activeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300/90 shadow-xs ring-1 ring-emerald-400/25',
        },
        {
          id: 'autumn',
          label: 'Hồng Ngọc',
          icon: '❤️',
          activeClass: 'bg-rose-100 text-rose-950 border-rose-300/90 shadow-xs ring-1 ring-rose-400/25',
        },
        {
          id: 'winter',
          label: 'Lam Ngọc',
          icon: '💙',
          activeClass: 'bg-indigo-100 text-indigo-950 border-indigo-300/90 shadow-xs ring-1 ring-indigo-400/25',
        },
      ]
    case 'brick':
      return [
        {
          id: 'spring',
          label: 'Lễ Hội',
          icon: '🌟',
          activeClass: 'bg-amber-100 text-amber-950 border-amber-300/90 shadow-xs ring-1 ring-amber-400/25',
        },
        {
          id: 'summer',
          label: 'Nhiệt Đới',
          icon: '🌴',
          activeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300/90 shadow-xs ring-1 ring-emerald-400/25',
        },
        {
          id: 'autumn',
          label: 'Cổ Điển',
          icon: '🕹️',
          activeClass: 'bg-orange-100 text-orange-950 border-orange-300/90 shadow-xs ring-1 ring-orange-400/25',
        },
        {
          id: 'winter',
          label: 'Không Gian',
          icon: '🚀',
          activeClass: 'bg-sky-100 text-sky-950 border-sky-300/90 shadow-xs ring-1 ring-sky-400/25',
        },
      ]
    case 'tree':
    case 'zen':
    case 'island':
    default:
      return [
        {
          id: 'spring',
          label: 'Xuân',
          icon: 'mai',
          activeClass: 'bg-amber-100 text-amber-950 border-amber-300/80 shadow-xs ring-1 ring-amber-400/20',
        },
        {
          id: 'summer',
          label: 'Hạ',
          icon: '☀️',
          activeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300/80 shadow-xs ring-1 ring-emerald-400/20',
        },
        {
          id: 'autumn',
          label: 'Thu',
          icon: '🍁',
          activeClass: 'bg-orange-100 text-orange-950 border-orange-300/80 shadow-xs ring-1 ring-orange-400/20',
        },
        {
          id: 'winter',
          label: 'Đông',
          icon: '❄️',
          activeClass: 'bg-sky-100 text-sky-950 border-sky-300/80 shadow-xs ring-1 ring-sky-400/20',
        },
      ]
  }
}

export type ArtPresetId = 'lotus' | 'galaxy' | 'hoian'

/**
 * Generates high-resolution 768x768 artistic canvas paintings client-side
 * so users can test Photo Sculpture QR with 1 click even without uploading a file.
 */
export function createPresetPhotoDataUrl(preset: ArtPresetId): string {
  const size = 768
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (preset === 'lotus') {
    // Golden Vietnamese Lotus Pond
    const bg = ctx.createRadialGradient(size * 0.5, size * 0.5, 30, size * 0.5, size * 0.5, size * 0.7)
    bg.addColorStop(0, '#fef08a')
    bg.addColorStop(0.35, '#10b981')
    bg.addColorStop(0.75, '#047857')
    bg.addColorStop(1, '#064e3b')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)

    // Lotus pads
    ctx.fillStyle = 'rgba(20, 83, 45, 0.55)'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(size / 2 + Math.cos(a) * 230, size / 2 + Math.sin(a) * 230, 95, 0, Math.PI * 2)
      ctx.fill()
    }

    // Blooming Lotus Petals
    const layers = [
      { count: 12, len: 240, wid: 72, col1: '#f43f5e', col2: '#fda4af' },
      { count: 10, len: 185, wid: 58, col1: '#fb7185', col2: '#ffe4e6' },
      { count: 8, len: 125, wid: 44, col1: '#facc15', col2: '#fef08a' },
    ]
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        ctx.save()
        ctx.translate(size / 2, size / 2)
        ctx.rotate((i / layer.count) * Math.PI * 2)
        const pGrad = ctx.createLinearGradient(0, 0, 0, -layer.len)
        pGrad.addColorStop(0, layer.col1)
        pGrad.addColorStop(1, layer.col2)
        ctx.fillStyle = pGrad
        ctx.beginPath()
        ctx.ellipse(0, -layer.len * 0.5, layer.wid * 0.5, layer.len * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Golden Pistil Core
    ctx.fillStyle = '#eab308'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, 52, 0, Math.PI * 2)
    ctx.fill()
  } else if (preset === 'galaxy') {
    // Cosmic Nebula & Starlight Vortex
    const bg = ctx.createLinearGradient(0, 0, size, size)
    bg.addColorStop(0, '#090d16')
    bg.addColorStop(0.3, '#1e1b4b')
    bg.addColorStop(0.65, '#6d28d9')
    bg.addColorStop(1, '#0284c7')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)

    for (let ring = 6; ring >= 1; ring--) {
      const r = ring * 55
      const g = ctx.createRadialGradient(size / 2, size / 2, r * 0.1, size / 2, size / 2, r)
      g.addColorStop(0, ring % 2 === 0 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(236, 72, 153, 0.55)')
      g.addColorStop(0.6, 'rgba(168, 85, 247, 0.25)')
      g.addColorStop(1, 'rgba(15, 23, 42, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Bright Star Core
    const core = ctx.createRadialGradient(size / 2, size / 2, 5, size / 2, size / 2, 110)
    core.addColorStop(0, '#ffffff')
    core.addColorStop(0.4, '#fde047')
    core.addColorStop(1, 'rgba(253, 224, 71, 0)')
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, 110, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Hoi An Lantern Night & Golden Heritage
    const bg = ctx.createLinearGradient(0, 0, 0, size)
    bg.addColorStop(0, '#1e1b4b')
    bg.addColorStop(0.45, '#9a3412')
    bg.addColorStop(0.8, '#eab308')
    bg.addColorStop(1, '#1e293b')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)

    const lanterns = [
      { x: size * 0.5, y: size * 0.42, r: 145, c1: '#fef08a', c2: '#ea580c' },
      { x: size * 0.24, y: size * 0.3, r: 85, c1: '#fda4af', c2: '#e11d48' },
      { x: size * 0.76, y: size * 0.3, r: 85, c1: '#67e8f9', c2: '#0284c7' },
      { x: size * 0.26, y: size * 0.72, r: 90, c1: '#fde047', c2: '#d97706' },
      { x: size * 0.74, y: size * 0.72, r: 90, c1: '#f9a8d4', c2: '#db2777' },
    ]
    for (const l of lanterns) {
      const lg = ctx.createRadialGradient(l.x, l.y, l.r * 0.1, l.x, l.y, l.r)
      lg.addColorStop(0, '#ffffff')
      lg.addColorStop(0.35, l.c1)
      lg.addColorStop(0.85, l.c2)
      lg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = lg
      ctx.beginPath()
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}
