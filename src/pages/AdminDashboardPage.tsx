import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  FileSpreadsheet,
  Eye,
  Trash2,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  GraduationCap,
  Award,
  Calendar,
  X,
  RefreshCw,
  FolderOpen,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getApplicationsApi,
  deleteApplicationApi,
  exportApplicationsExcelApi,
} from '../api/client';
import { Application } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Khởi tạo các trạng thái (State)
  const [applications, setApplications] = useState<Application[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Trạng thái hiển thị các cửa sổ Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [deleteTargetApp, setDeleteTargetApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Kiểm tra quyền xác thực quản trị viên
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Trì hoãn tìm kiếm (debounce) để tối ưu hiệu năng
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Đặt lại về trang đầu tiên khi tìm kiếm
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Lấy danh sách hồ sơ ứng tuyển
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await getApplicationsApi({
        page,
        pageSize,
        search: searchQuery,
      });
      setApplications(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error('Không thể tải danh sách hồ sơ ứng tuyển.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, pageSize, searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    toast.success('Đã đăng xuất.');
    navigate('/admin/login');
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await exportApplicationsExcelApi(searchQuery);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}`;
      a.download = `HoSoUngTuyen-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Xuất tệp Excel thành công!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Có lỗi xảy ra khi xuất tệp Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetApp) return;
    setIsDeleting(true);
    try {
      await deleteApplicationApi(deleteTargetApp.id);
      toast.success('Đã xóa hồ sơ và các tệp đính kèm trên Cloudinary.');
      setDeleteTargetApp(null);
      fetchApplications();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Không thể xóa hồ sơ.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dStr: string) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}/${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  const formatDateTime = (dStr: string) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes()
      ).padStart(2, '0')}`;
    } catch {
      return dStr;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tiêu đề đầu trang */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Danh Sách Hồ Sơ Ứng Tuyển</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {total} hồ sơ
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu, kiểm tra văn bằng, ảnh chân dung và xuất báo cáo danh sách ứng viên
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting || total === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Đang xuất Excel...' : 'Xuất Excel'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-medium text-sm transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo họ tên hoặc số CCCD..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bộ chọn số lượng hiển thị trên trang */}
        <div className="flex items-center space-x-2 text-sm text-slate-600 self-end sm:self-auto">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value={10}>10 dòng / trang</option>
            <option value={20}>20 dòng / trang</option>
            <option value={50}>50 dòng / trang</option>
          </select>
        </div>
      </div>

      {/* Thẻ bảng hiển thị dữ liệu chính */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">STT</th>
                <th className="py-3.5 px-4 text-center w-16">Ảnh</th>
                <th className="py-3.5 px-4 min-w-[160px]">Họ và tên</th>
                <th className="py-3.5 px-4 min-w-[120px]">Số CCCD</th>
                <th className="py-3.5 px-4 min-w-[110px]">Ngày cấp CCCD</th>
                <th className="py-3.5 px-4 min-w-[160px]">Chuyên ngành ĐH</th>
                <th className="py-3.5 px-4 min-w-[110px]">Ngày cấp ĐH</th>
                <th className="py-3.5 px-4 min-w-[120px]">Số hiệu ĐH</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">Tệp ĐH</th>
                <th className="py-3.5 px-4 min-w-[160px]">Chuyên ngành ThS</th>
                <th className="py-3.5 px-4 min-w-[110px]">Ngày cấp ThS</th>
                <th className="py-3.5 px-4 min-w-[120px]">Số hiệu ThS</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">Tệp ThS</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">PDF Tóm tắt</th>
                <th className="py-3.5 px-4 min-w-[140px]">Ngày nộp</th>
                <th className="py-3.5 px-4 text-center min-w-[100px] sticky right-0 bg-slate-50 shadow-sm">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Khung xương giao diện khi đang tải (Skeleton loading)
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 bg-slate-200 rounded w-6 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-9 h-11 bg-slate-200 rounded-lg mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-4 px-4 text-center sticky right-0 bg-white">
                      <div className="h-7 bg-slate-200 rounded w-16 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-16 text-center text-slate-400">
                    <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-600">Không tìm thấy hồ sơ nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                        : 'Chưa có ứng viên nào gửi hồ sơ tuyển dụng'}
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app, index) => (
                  <tr key={app.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {app.avatarUrl ? (
                        <a
                          href={app.avatarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block group"
                          title="Bấm để xem ảnh lớn"
                        >
                          <img
                            src={app.avatarUrl}
                            alt={app.fullName}
                            className="w-9 h-11 rounded-md object-cover border border-slate-200 shadow-xs group-hover:scale-110 transition-transform"
                          />
                        </a>
                      ) : (
                        <div className="w-9 h-11 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{app.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{app.cccd}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(app.cccdIssueDate)}</td>
                    <td className="py-3 px-4 text-slate-800">{app.bachelorMajor}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(app.bachelorIssueDate)}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-xs">{app.bachelorSerialNumber}</td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={app.bachelorFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        title="Xem tệp bằng đại học"
                      >
                        <span>Xem PDF</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{app.masterMajor}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(app.masterIssueDate)}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-xs">{app.masterSerialNumber}</td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={app.masterFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        title="Xem tệp bằng thạc sĩ"
                      >
                        <span>Xem PDF</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={app.summaryPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Xem PDF tóm tắt"
                      >
                        <span>Tóm tắt</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(app.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-center sticky right-0 bg-white/95 backdrop-blur-sm shadow-sm whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetApp(app)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa hồ sơ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang dữ liệu từ máy chủ */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Hiển thị từ <span className="font-semibold text-slate-700">{(page - 1) * pageSize + 1}</span> đến{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * pageSize, total)}</span> trong tổng số{' '}
            <span className="font-semibold text-slate-700">{total}</span> hồ sơ
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Trước</span>
            </button>

            <span className="text-xs font-medium text-slate-600 px-2">
              Trang {page} / {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Hộp thoại chi tiết hồ sơ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chi Tiết Hồ Sơ Ứng Tuyển</h3>
                <p className="text-xs text-slate-500 font-mono">Mã: {selectedApp.id}</p>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              {/* Thông tin cá nhân kèm ảnh chân dung */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 text-blue-700">
                  1. Thông tin cá nhân
                </h4>
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Khung ảnh chân dung */}
                  <div className="flex-shrink-0">
                    {selectedApp.avatarUrl ? (
                      <a
                        href={selectedApp.avatarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <img
                          src={selectedApp.avatarUrl}
                          alt={selectedApp.fullName}
                          className="w-24 h-32 rounded-xl object-cover border-2 border-white shadow-md group-hover:opacity-90 transition-opacity"
                        />
                        <span className="text-[10px] text-blue-600 mt-1 block text-center font-medium">
                          Mở ảnh gốc ↗
                        </span>
                      </a>
                    ) : (
                      <div className="w-24 h-32 rounded-xl bg-slate-200 border-2 border-white shadow-inner flex flex-col items-center justify-center text-slate-400">
                        <User className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-medium">Không có ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div>
                      <span className="text-xs text-slate-500 block">Họ và tên:</span>
                      <span className="font-semibold text-slate-900">{selectedApp.fullName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Số CCCD:</span>
                      <span className="font-semibold font-mono text-slate-900">{selectedApp.cccd}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Ngày cấp CCCD:</span>
                      <span className="text-slate-800">{formatDate(selectedApp.cccdIssueDate)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Thời gian nộp:</span>
                      <span className="text-slate-800">{formatDateTime(selectedApp.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin bằng đại học */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 text-indigo-700">
                  2. Bằng tốt nghiệp đại học
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 block">Chuyên ngành:</span>
                    <span className="font-semibold text-slate-900">{selectedApp.bachelorMajor}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Ngày cấp:</span>
                    <span className="text-slate-800">{formatDate(selectedApp.bachelorIssueDate)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Số hiệu bằng:</span>
                    <span className="font-mono text-slate-900">{selectedApp.bachelorSerialNumber}</span>
                  </div>
                  <div className="col-span-2 pt-2">
                    <a
                      href={selectedApp.bachelorFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      <span>Xem tệp bằng đại học (PDF)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Thông tin bằng thạc sĩ */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 text-amber-700">
                  3. Bằng tốt nghiệp thạc sĩ
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 block">Chuyên ngành:</span>
                    <span className="font-semibold text-slate-900">{selectedApp.masterMajor}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Ngày cấp:</span>
                    <span className="text-slate-800">{formatDate(selectedApp.masterIssueDate)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Số hiệu bằng:</span>
                    <span className="font-mono text-slate-900">{selectedApp.masterSerialNumber}</span>
                  </div>
                  <div className="col-span-2 pt-2">
                    <a
                      href={selectedApp.masterFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      <span>Xem tệp bằng thạc sĩ (PDF)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Tệp PDF tổng hợp */}
              <div className="pt-2 text-center">
                <a
                  href={selectedApp.summaryPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span>Mở / Tải PDF Tóm Tắt Toàn Bộ Hồ Sơ</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận xóa */}
      {deleteTargetApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác Nhận Xóa Hồ Sơ</h3>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa hồ sơ của ứng viên{' '}
              <strong className="text-slate-900">{deleteTargetApp.fullName}</strong> (CCCD:{' '}
              {deleteTargetApp.cccd})? Hành động này sẽ đồng thời xóa toàn bộ tệp PDF và ảnh chân dung đã tải lên Cloudinary.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetApp(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition-colors inline-flex items-center space-x-2 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
