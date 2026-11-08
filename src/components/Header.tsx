import React from 'react'
import { Sparkles, QrCode, Rocket, HelpCircle, ShieldCheck } from 'lucide-react'
import type { ActualSeason } from '../types'
import { SEASONS } from '../utils/seasonUtils'

interface HeaderProps {
  currentSeason: ActualSeason
  onOpenScanGuide: () => void
  onOpenDeployGuide: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentSeason,
  onOpenScanGuide,
  onOpenDeployGuide,
}) => {
  const seasonData = SEASONS.find((s) => s.id === currentSeason) || SEASONS[1]

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none px-4 py-3 md:px-6 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand & Seasonal Badge */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative group">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20 transition-transform group-hover:scale-105">
              <QrCode className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090d16] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SeasonQR
              </span>

              {/* Dynamic Seasonal Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all shadow-sm ${seasonData.badgeClass}`}
                title={`Mùa hiện tại: ${seasonData.name}`}
              >
                <span>{seasonData.emoji}</span>
                <span className="hidden sm:inline">Mùa {seasonData.name}</span>
                <Sparkles className="w-3 h-3 opacity-70 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <p className="text-[11px] md:text-xs text-slate-400 flex items-center gap-1.5">
              <span>Trình Tạo Mã QR 3D Nghệ Thuật</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 inline" /> 100% Client-side & Miễn phí
              </span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          {/* Scan Guide Button */}
          <button
            onClick={onOpenScanGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Mẹo & Hướng dẫn quét QR 3D chuẩn xác"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Mẹo quét</span> QR
          </button>

          {/* GitHub Pages Deploy Guide */}
          <button
            onClick={onOpenDeployGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/50 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Hướng dẫn đưa lên GitHub Pages miễn phí trong 2 phút"
          >
            <Rocket className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
            <span className="hidden sm:inline">Deploy</span> GitHub Pages
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 shadow-sm backdrop-blur-md transition-all hover:text-white hover:scale-105"
            title="Xem mã nguồn trên GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
