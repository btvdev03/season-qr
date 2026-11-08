import React, { useState } from 'react'
import {
  Link2,
  X,
  Compass,
  RotateCw,
  Camera,
  Download,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Check,
  Eye,
  Sliders,
} from 'lucide-react'
import type { SeasonKey, StyleKey, ViewMode } from '../types'
import { SEASONS, STYLES } from '../utils/seasonUtils'

interface ControlPanelProps {
  url: string
  setUrl: (url: string) => void
  season: SeasonKey
  setSeason: (season: SeasonKey) => void
  style: StyleKey
  setStyle: (style: StyleKey) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  autoRotate: boolean
  setAutoRotate: (autoRotate: boolean) => void
  onResetCamera: () => void
  onExport: (mode: 'current' | 'topDown') => Promise<void>
  isExporting: boolean
}

const PRESETS = [
  { label: 'Portfolio', url: 'https://github.com' },
  { label: 'Facebook', url: 'https://facebook.com' },
  { label: 'TikTok', url: 'https://tiktok.com/@tiktok' },
  { label: 'Website', url: 'https://seasonqr.dev' },
]

export const ControlPanel: React.FC<ControlPanelProps> = ({
  url,
  setUrl,
  season,
  setSeason,
  style,
  setStyle,
  viewMode,
  setViewMode,
  autoRotate,
  setAutoRotate,
  onResetCamera,
  onExport,
  isExporting,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [exportMode, setExportMode] = useState<'current' | 'topDown'>('current')

  const handleExportClick = () => {
    onExport(exportMode)
  }

  return (
    <aside
      className={`fixed z-30 transition-all duration-300 ease-in-out pointer-events-auto
        /* Mobile: Bottom drawer */
        bottom-0 left-0 right-0 max-h-[85vh]
        /* Desktop: Floating right sidebar */
        md:top-20 md:right-6 md:bottom-6 md:left-auto md:w-[410px] md:max-h-[calc(100vh-104px)]
      `}
    >
      <div className="flex flex-col h-full rounded-t-3xl md:rounded-3xl glass-panel shadow-2xl border border-white/10 overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/60 bg-slate-900/40 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Bảng Điều Khiển</h2>
              <p className="text-[11px] text-slate-400">Tùy biến nội dung & cảnh quan 3D</p>
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Mở rộng bảng điều khiển' : 'Thu gọn bảng điều khiển'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Body */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 text-xs text-slate-200">
            {/* 1. URL / Content Section */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                  Nội dung / Link QR
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Level H (30% phục hồi)</span>
              </label>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Nhập đường dẫn URL hoặc văn bản..."
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs transition-all"
                />
                {url && (
                  <button
                    onClick={() => setUrl('')}
                    className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                    title="Xóa nhanh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick preset pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Gợi ý:</span>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setUrl(preset.url)}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all ${
                      url === preset.url
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-medium'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Season Selector */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Chọn Mùa / Chủ Đề
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Hiệu ứng & Ánh sáng</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {SEASONS.map((s) => {
                  const isSelected = season === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSeason(s.id)}
                      className={`relative flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-base shrink-0">{s.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate text-[11px]">{s.name}</div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Style Selector */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Phong Cách Kiến Trúc 3D
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {STYLES.map((st) => {
                  const isSelected = style === st.id
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStyle(st.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md shadow-amber-500/10'
                          : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xl mb-1">{st.icon}</span>
                      <span className="font-semibold text-[11px] leading-tight line-clamp-1">
                        {st.name}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{st.tag}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Camera & View Controls */}
            <div className="space-y-2 pt-1 border-t border-slate-700/60">
              <label className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  Góc Nhìn & Camera
                </span>
              </label>

              {/* View Mode Toggle: Isometric vs Top-Down */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
                <button
                  onClick={() => setViewMode('isometric')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'isometric'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>3D Isometric</span>
                </button>
                <button
                  onClick={() => setViewMode('topDown')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'topDown'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Chế độ Quét 90°</span>
                </button>
              </div>

              {/* Camera Secondary Controls */}
              <div className="flex items-center gap-2 pt-1">
                {/* Auto Rotate Button */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    autoRotate
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                  <span>{autoRotate ? 'Đang xoay tự động' : 'Tự động xoay'}</span>
                </button>

                {/* Reset Camera */}
                <button
                  onClick={onResetCamera}
                  className="py-2 px-3 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-medium"
                  title="Đặt lại vị trí góc quay ban đầu"
                >
                  Reset Góc
                </button>
              </div>
            </div>

            {/* 5. Export Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-700/60">
              <label className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Xuất Ảnh QR HD
                </span>
              </label>

              {/* Mode choice: Current angle vs Top-Down scan */}
              <div className="flex items-center gap-3 text-[11px] text-slate-300 px-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportMode"
                    value="current"
                    checked={exportMode === 'current'}
                    onChange={() => setExportMode('current')}
                    className="accent-indigo-500"
                  />
                  <span>Góc 3D hiện tại</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportMode"
                    value="topDown"
                    checked={exportMode === 'topDown'}
                    onChange={() => setExportMode('topDown')}
                    className="accent-indigo-500"
                  />
                  <span className="text-emerald-300 font-medium">Top-Down (Dành để quét)</span>
                </label>
              </div>

              {/* Download Button */}
              <button
                disabled={isExporting}
                onClick={handleExportClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang xuất ảnh Ultra HD...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Tải Ảnh QR HD (PNG)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
