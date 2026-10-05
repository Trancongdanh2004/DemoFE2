import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, ShieldCheck, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block">
              RECRUITMENT PORTAL
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:block">
              Hệ thống Tiếp nhận Hồ sơ Ứng tuyển
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          <Link
            to="/"
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Nộp hồ sơ</span>
          </Link>

          <Link
            to="/admin"
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAdmin
                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Quản trị viên</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
