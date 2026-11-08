import React from 'react'
import { X, Scan, ShieldAlert, Smartphone } from 'lucide-react'

interface ScanGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToTopDown: () => void
}

export const ScanGuideModal: React.FC<ScanGuideModalProps> = ({
  isOpen,
  onClose,
  onSwitchToTopDown,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Bí Quyết Quét QR 3D Chuẩn 100%</h3>
              <p className="text-xs text-slate-400">Công nghệ mã hóa Level H & Mẹo nhận diện nhanh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-slate-300">
          {/* Level H explanation card */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-indigo-200 text-xs uppercase tracking-wider mb-1">
                Chuẩn mã hóa QR Level H (High Resilience)
              </h4>
              <p className="text-xs leading-relaxed text-indigo-100/90">
                SeasonQR tự động áp dụng <strong>QR Error Correction Level H</strong> cao cấp nhất, cho phép khôi phục tới <strong>30% dữ liệu</strong> ngay cả khi các module QR bị khối 3D che khuất hoặc có tán cây, sỏi đá trang trí.
              </p>
            </div>
          </div>

          {/* Practical tips */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                1
              </div>
              <div>
                <span className="font-medium text-slate-100">Dùng Chế độ Quét (Top-Down):</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm nút <strong>"📱 Chế độ Quét"</strong> trên thanh điều khiển. Camera sẽ căn thẳng góc 90° từ trên xuống, giúp camera điện thoại nhận diện mã ngay trong 0.2 giây!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                2
              </div>
              <div>
                <span className="font-medium text-slate-100">Khoảng cách & Ánh sáng:</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Giữ điện thoại cách màn hình khoảng 20 - 35 cm. Tránh để chói lóa ánh đèn trực tiếp lên bề mặt màn hình.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                3
              </div>
              <div>
                <span className="font-medium text-slate-100">Góc 3D Isometric nghệ thuật:</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Khi để góc nghiêng 3D, hãy nghiêng nhẹ điện thoại cùng chiều góc chiếu để camera iPhone / Android bắt được các góc định vị (Finder Patterns).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onSwitchToTopDown()
              onClose()
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Smartphone className="w-4 h-4" />
            Chuyển ngay sang Chế độ Quét
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
