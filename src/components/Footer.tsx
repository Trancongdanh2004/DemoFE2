import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/50 backdrop-blur-sm py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span>Thông tin hồ sơ cá nhân được mã hóa và bảo mật theo quy định bảo vệ dữ liệu.</span>
        </div>
        <p>© {new Date().getFullYear()} Hệ thống Tiếp nhận Hồ sơ Tuyển dụng. Đã đăng ký bản quyền.</p>
      </div>
    </footer>
  );
};
