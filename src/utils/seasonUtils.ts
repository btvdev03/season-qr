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
    description: 'Tự nhận diện mùa hiện tại theo thời gian thực tại Việt Nam',
    color: '#6366f1',
    accentColor: 'indigo',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'spring',
    name: 'Xuân Đào Mai',
    emoji: '🌸',
    description: 'Hoa đào phớt hồng miền Bắc quyện mai vàng phương Nam đón Tết',
    color: '#f472b6',
    accentColor: 'pink',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
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
    name: 'Cây Bonsai Cổ Thụ 4 Mùa',
    icon: '🌳',
    description: 'Cây cổ thụ biến hình tán lá 4 mùa, thảm cỏ hoa và rêu phong ôm gốc rễ',
    tag: 'Đặc sắc nhất',
  },
  {
    id: 'island',
    name: 'Đảo Ngọc Non Nước',
    icon: '🏝️',
    description: 'Kỳ quan đảo nổi bồng bềnh non nước Việt Nam với nhũ đá kỳ vĩ',
    tag: 'Kỳ ảo',
  },
  {
    id: 'zen',
    name: 'Vườn Thiền Non Bộ',
    icon: '⛩️',
    description: 'Nghệ thuật hòn non bộ, đèn đá tỏa sáng và sỏi thiền tĩnh tại',
    tag: 'Tĩnh tại',
  },
]
