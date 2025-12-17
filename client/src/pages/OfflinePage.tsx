/**
 * Offline Fallback Page
 * Hiển thị khi người dùng truy cập route không được phép offline
 */

import React from 'react';
import { WifiOff, Home, BookOpen } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4 text-center">
      {/* Icon */}
      <div className="mb-6">
        <WifiOff size={64} className="text-orange-400 mx-auto animate-pulse" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-slate-100 mb-3">
        Bạn đang ngoại tuyến
      </h1>

      {/* Description */}
      <p className="text-slate-300 max-w-md mb-6">
        Trang này cần kết nối internet để truy cập. Tuy nhiên, bạn vẫn có thể đọc những truyện đã tải về offline.
      </p>

      {/* Available actions */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-8 max-w-md w-full">
        <p className="text-slate-400 text-sm mb-4 font-medium">
          Những tính năng có sẵn khi offline:
        </p>
        <ul className="text-left space-y-2 text-sm text-slate-300">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Đọc truyện đã tải
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Quản lý thư viện offline
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Xem lịch sử đọc
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-400">✗</span>
            Tìm kiếm truyện mới
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-400">✗</span>
            Đăng truyện mới
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-400">✗</span>
            Gửi bình luận
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <a
          href="#offline-library"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
        >
          <BookOpen size={20} />
          <span>Đi đến thư viện offline</span>
        </a>

        <button
          onClick={() => {
            // Attempt to reconnect
            if (navigator.onLine) {
              window.location.reload();
            } else {
              alert('Vẫn chưa có kết nối. Hãy kiểm tra WiFi hoặc dữ liệu di động.');
            }
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-amber-600 text-amber-400 hover:bg-amber-600/10 rounded-lg font-semibold transition-colors"
        >
          <Home size={20} />
          <span>Quay lại trang chủ</span>
        </button>
      </div>

      {/* Status */}
      <div className="mt-12 text-sm text-slate-500">
        <p>🌐 Trạng thái: <span className="text-orange-400 font-semibold">Ngoại tuyến</span></p>
        <p className="mt-2">Kết nối sẽ được khôi phục tự động khi có internet</p>
      </div>
    </div>
  );
}
