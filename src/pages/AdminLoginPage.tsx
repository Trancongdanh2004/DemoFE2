import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminLoginApi } from '../api/client';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const response = await adminLoginApi(data);
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin_user', JSON.stringify(response.admin));
      toast.success('Đăng nhập trang quản trị thành công!');
      navigate('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/10">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đăng Nhập Quản Trị</h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Hệ thống quản lý và xuất dữ liệu hồ sơ tuyển dụng
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tài khoản
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="admin"
                  {...register('username')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.username
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 disabled:opacity-60 transition-all flex items-center justify-center space-x-2 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập hệ thống</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Mặc định: tài khoản <code className="text-slate-600 font-mono">admin</code> / mật khẩu <code className="text-slate-600 font-mono">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
