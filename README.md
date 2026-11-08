# 🌸 SeasonQR — Trình Tạo Mã QR 3D Nghệ Thuật Theo Mùa
> **Artistic Seasonal 3D QR Code Generator** • 100% Client-Side • Three.js • React 19 • Tailwind CSS v4

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-2ea44f?style=flat-square&logo=github)](https://github.com)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r187-black?style=flat-square&logo=three.js)](https://threejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Tiếng Việt](#-tiếng-việt) | [English](#-english)

---

## 🇻🇳 Tiếng Việt

**SeasonQR** là ứng dụng web tạo mã QR 3D sống động, kết hợp giữa nghệ thuật thị giác và tính chính xác tuyệt đối của công nghệ mã QR. Người dùng có thể chiêm ngưỡng mã QR hóa thân thành một khu vườn xuân anh đào rơi, hòn đảo mùa hè nhiệt đới, cánh rừng phong mùa thu, thế giới băng tuyết mùa đông hay cảnh quan Cyberpunk huyền ảo.

### ✨ Tính Năng Nổi Bật

1. **4 Mùa & Cyberpunk (5 Themes)**
   - 🌸 **Xuân (Spring)**: Hoa anh đào nở rộ, hiệu ứng hạt cánh hoa bay phấp phới.
   - ☀️ **Hạ (Summer)**: Nắng vàng rực rỡ, đom đóm lập lòe, phong cách biển đảo nhiệt đới.
   - 🍁 **Thu (Autumn)**: Rừng phong lá đỏ cam lãng mạn, lá rụng bay theo gió.
   - ❄️ **Đông (Winter)**: Bông tuyết trắng rơi mềm mại, khối băng ngọc bích tinh khiết.
   - 🔮 **Cyberpunk**: Đèn Neon tương lai, hiệu ứng Grid số học & tia lửa điện bốc lên.
   - ⏳ **Tự động theo tháng**: Nhận diện mùa thực tế theo lịch máy tính.

2. **3 Phong Cách Kiến Trúc 3D (3 Styles)**
   - 🌳 **Cây 4 Mùa (Tree)**: Cây cổ thụ biến đổi tán lá theo từng mùa.
   - 🏝️ **Đảo Bay (Floating Island)**: Mã QR nổi bồng bềnh giữa mây trời và vách đá.
   - ⛩️ **Vườn Zen (Zen Garden)**: Cổng Torii, đá thiền và sỏi trắng tối giản kiểu Nhật.

3. **Quét Chuẩn 100% — QR Error Correction Level H**
   - Áp dụng chuẩn phục hồi lỗi Level H cao nhất (phục hồi tới 30% dữ liệu).
   - Module định vị (Finder Patterns) được bảo vệ tuyệt đối với độ tương phản cao.
   - Nút chuyển nhanh **"📱 Chế độ Quét (Top-Down)"** đưa camera về góc nhìn 90° từ trên xuống, quét ngay trong 0.2 giây.

4. **100% Client-Side & Bảo Mật**
   - Mọi tiến trình tính toán ma trận QR và dựng hình 3D đều thực thi trực tiếp trên trình duyệt (in-browser).
   - Không có dữ liệu nào bị gửi về máy chủ bên thứ ba. Hoàn toàn riêng tư và miễn phí trọn đời.

5. **Xuất Ảnh HD & Hiệu Ứng Pháo Hoa (Confetti)**
   - Tải ảnh PNG độ nét cao (lựa chọn chụp góc 3D nghệ thuật hoặc góc Top-Down).
   - Hiệu ứng pháo hoa chúc mừng rực rỡ khi tạo và tải ảnh thành công.

---

### 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ

Yêu cầu: [Node.js](https://nodejs.org) phiên bản 18+ trở lên.

```bash
# 1. Clone repo hoặc điều hướng vào thư mục dự án
cd season-qr

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy server phát triển
npm run dev

# Mở trình duyệt tại: http://localhost:5173
```

Để kiểm tra bản build đóng gói:
```bash
npm run build
npm run preview
```

---

### 🌐 Hướng Dẫn Deploy Lên GitHub Pages (0đ Chi Phí)

Dự án đã được cấu hình sẵn `base: './'` trong `vite.config.ts` và tích hợp file GitHub Actions `.github/workflows/deploy.yml`.

1. **Tạo repository mới trên GitHub** (Public).
2. **Đẩy mã nguồn lên nhánh `main`:**
   ```bash
   git init
   git add .
   git commit -m "feat: launch SeasonQR"
   git branch -M main
   git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
   git push -u origin main
   ```
3. **Kích hoạt GitHub Pages:**
   - Vào repository trên GitHub &rarr; chọn **Settings** &rarr; **Pages**.
   - Tại mục **Build and deployment > Source**, chọn **GitHub Actions**.
   - GitHub sẽ tự động chạy workflow build và deploy trang web của bạn lên:  
     `https://<USERNAME>.github.io/<REPO_NAME>/` chỉ sau 1 phút!

---

### 🧩 Hướng Dẫn Mở Rộng Thêm Phong Cách 3D Mới

Hệ thống được thiết kế theo kiến trúc module mở (`QRStyleGenerator` interface). Để thêm một phong cách 3D mới (ví dụ: *Lâu Đài Cổ Tích - Castle*):

1. Tạo file mới: `src/engine/styles/castleStyle.ts`
2. Implement interface `QRStyleGenerator`:
   ```typescript
   import type { QRStyleGenerator, StyleGenerateParams } from './types';
   import { buildQRBase } from './baseQRBuilder';
   import * as THREE from 'three';

   export class CastleStyleGenerator implements QRStyleGenerator {
     readonly id = 'castle';
     readonly name = 'Fairy Castle';
     readonly vietnameseName = 'Lâu Đài Cổ Tích';
     readonly icon = '🏰';
     readonly description = 'Tòa tháp cổ tích rực rỡ';
     readonly vietnameseDescription = 'Lâu đài kỳ ảo vươn cao';

     generate({ matrix, season, sceneSize }: StyleGenerateParams): THREE.Group {
       const group = new THREE.Group();
       const base = buildQRBase(matrix, season, { sceneSize });
       group.add(base.group);
       // Thêm các khối lâu đài, tường thành tại đây...
       return group;
     }
   }
   ```
3. Đăng ký style mới vào `src/engine/styles/index.ts` và danh sách `STYLES` trong `src/utils/seasonUtils.ts`.

---

## 🇬🇧 English

**SeasonQR** is an innovative 3D artistic QR code generator combining visual aesthetics with 100% scannable precision. Powered by Three.js, React 19, and QR Error Correction Level H.

### Key Features
- **5 Seasonal Themes**: Spring (cherry petals), Summer (tropical islands & fireflies), Autumn (falling maple leaves), Winter (snow & icy crystals), and Cyberpunk (neon holograms).
- **3 Architectural Styles**: Seasonal Tree, Floating Island, and Zen Garden.
- **100% Reliable Scanning**: Level H recovery allows up to 30% of modules to be covered by 3D props while maintaining full data integrity.
- **Top-Down Mode**: Instant 90-degree alignment camera angle for seamless scanning.
- **Zero Server Footprint**: Runs completely in the browser for privacy and speed.
- **One-Click HD Export**: High-resolution PNG snapshots with celebratory confetti.

---

### 📜 Giấy Phép (License)
Dự án được phân phối dưới giấy phép **MIT License**. Bạn được tự do sử dụng, chỉnh sửa và triển khai thương mại hoặc phi thương mại.
