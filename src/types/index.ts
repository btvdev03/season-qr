export type SeasonKey = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter' | 'cyberpunk'
export type ActualSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'cyberpunk'
export type StyleKey = 'tree' | 'island' | 'zen'
export type ViewMode = 'isometric' | 'topDown'

export interface SeasonInfo {
  id: SeasonKey
  name: string
  emoji: string
  description: string
  color: string
  accentColor: string
  badgeClass: string
}

export interface StyleInfo {
  id: StyleKey
  name: string
  icon: string
  description: string
  tag: string
}

export interface QRConfig {
  url: string
  season: SeasonKey
  actualSeason: ActualSeason
  style: StyleKey
  viewMode: ViewMode
  autoRotate: boolean
}
