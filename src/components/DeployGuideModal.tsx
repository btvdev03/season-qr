import React, { useState } from 'react'
import { X, Rocket, Copy, Check, ExternalLink, Globe, Sparkles } from 'lucide-react'

interface DeployGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null)

  if (!isOpen) return null

  const copyToClipboard = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(stepNumber)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const gitCommands = `git init
git add .
git commit -m "feat: launch SeasonQR 3D artistic QR generator"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Deploy Lên GitHub Pages Trong 2 Phút</h3>
              <p className="text-xs text-slate-400">100% Miễn phí trọn đời • Tự động CI/CD qua GitHub Actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-300">
          {/* Highlight Callout */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-emerald-200 font-semibold mb-0.5">Sẵn Sàng Out-Of-The-Box!</p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Dự án đã cấu hình sẵn <code>base: './'</code> trong <code>vite.config.ts</code> và file workflow tự động <code>.github/workflows/deploy.yml</code>. Bạn chỉ cần đẩy code lên GitHub!
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Tạo Repository mới trên GitHub</span>
              </div>
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Tạo Repo ngay <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-400 text-[11px]">
              Vào GitHub tạo repo mới (Public), ví dụ đặt tên là: <code>season-qr</code>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Đẩy mã nguồn lên GitHub</span>
              </div>
              <button
                onClick={() => copyToClipboard(gitCommands, 2)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 transition-colors text-[11px]"
              >
                {copiedStep === 2 ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã copy</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy lệnh Git</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#0b0f19] p-2.5 rounded-xl border border-slate-700/60 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto">
              <pre>{gitCommands}</pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Bật GitHub Pages với GitHub Actions</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Vào repo trên GitHub &rarr; chọn tab <strong>Settings</strong></li>
              <li>Tại menu bên trái, cuộn xuống chọn mục <strong>Pages</strong></li>
              <li>Ở phần <strong>Build and deployment &rarr; Source</strong>: Chọn <strong>GitHub Actions</strong></li>
              <li>Nhìn tab <strong>Actions</strong>: Tiến trình tự động build & deploy trong 45 giây!</li>
            </ol>
            <div className="mt-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-indigo-300 flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                Trang web của bạn sẽ hoạt động tại:{' '}
                <strong className="text-white">https://&lt;username&gt;.github.io/&lt;repo&gt;/</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
