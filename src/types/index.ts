export type SeasonKey = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'
export type ActualSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export type StyleKey =
  | 'tree'
  | 'cyber'
  | 'zen'
  | 'island'
  | 'crystal'
  | 'brick'
  | 'photo'
export type ViewMode = 'isometric' | 'topDown'

export type QRContentType = 'url' | 'text' | 'wifi' | 'contact'

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
  shortName: string
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
