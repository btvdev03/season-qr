import type { ActualSeason, SeasonInfo, StyleInfo, SeasonKey } from '../types'

export function getAutoSeason(): ActualSeason {
  const month = new Date().getMonth() + 1 // 1 - 12
  // Northern Hemisphere / Vietnam seasons:
  // Xuân (Spring): 3, 4, 5
  // Hạ (Summer): 6, 7, 8
  // Thu (Autumn): 9, 10, 11
  // Đông (Winter): 12, 1, 2
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
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
    description: 'Tự nhận diện mùa hiện tại theo thời gian thực',
    color: '#6366f1',
    accentColor: 'indigo',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'spring',
    name: 'Xuân',
    emoji: '🌸',
    description: 'Hoa anh đào nở rộ, mưa cánh hoa bay ngập tràn sức sống',
    color: '#f472b6',
    accentColor: 'pink',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
  {
    id: 'summer',
    name: 'Hạ',
    emoji: '☀️',
    description: 'Ánh nắng nhiệt đới vàng ươm, cây cối xanh tươi, sóng biển',
    color: '#fbbf24',
    accentColor: 'amber',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'autumn',
    name: 'Thu',
    emoji: '🍁',
    description: 'Lá phong cam vàng rực rỡ, gió thu lãng đãng yên bình',
    color: '#fb923c',
    accentColor: 'orange',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  {
    id: 'winter',
    name: 'Đông',
    emoji: '❄️',
    description: 'Bông tuyết trắng rơi mềm mại, khối băng tinh khiết huyền ảo',
    color: '#38bdf8',
    accentColor: 'sky',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '🔮',
    description: 'Ánh đèn Neon tương lai, hiệu ứng Grid số học & Hologram',
    color: '#d946ef',
    accentColor: 'fuchsia',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  },
]

export const STYLES: StyleInfo[] = [
  {
    id: 'tree',
    name: 'Cây 4 Mùa',
    icon: '🌳',
    description: 'Cây cổ thụ biến đổi tán lá theo từng mùa ở góc QR',
    tag: 'Phổ biến',
  },
  {
    id: 'island',
    name: 'Đảo Bay',
    icon: '🏝️',
    description: 'Mã QR được nâng đỡ trên một hòn đảo lơ lửng giữa mây ngàn',
    tag: 'Ngoạn mục',
  },
  {
    id: 'zen',
    name: 'Vườn Zen',
    icon: '⛩️',
    description: 'Kiến trúc tối giản, cổng Torii, đá thiền & cát trắng tĩnh lặng',
    tag: 'Tinh tế',
  },
]
