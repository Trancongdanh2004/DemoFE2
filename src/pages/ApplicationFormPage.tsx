import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  CreditCard,
  Calendar,
  GraduationCap,
  Award,
  UploadCloud,
  FileCheck,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { submitApplicationApi } from '../api/client';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Form validation schema
const formSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Họ và tên phải có ít nhất 2 ký tự.')
      .max(255, 'Họ và tên không được vượt quá 255 ký tự.'),
    cccd: z
      .string()
      .trim()
      .regex(/^\d{12}$/, 'Số CCCD phải gồm đúng 12 chữ số.'),
    cccdIssueDate: z
      .string({ required_error: 'Vui lòng chọn ngày cấp CCCD.' })
      .refine((val) => dateRegex.test(val) && !isNaN(Date.parse(val)), {
        message: 'Ngày cấp CCCD không hợp lệ.',
      })
      .refine((val) => new Date(val) <= new Date(), {
        message: 'Ngày cấp CCCD không được trong tương lai.',
      }),
    bachelorMajor: z
      .string()
      .trim()
      .min(2, 'Chuyên ngành đại học phải có ít nhất 2 ký tự.')
      .max(255, 'Chuyên ngành đại học không được vượt quá 255 ký tự.'),
    bachelorIssueDate: z
      .string({ required_error: 'Vui lòng chọn ngày cấp bằng đại học.' })
      .refine((val) => dateRegex.test(val) && !isNaN(Date.parse(val)), {
        message: 'Ngày cấp bằng đại học không hợp lệ.',
      })
      .refine((val) => new Date(val) <= new Date(), {
        message: 'Ngày cấp bằng đại học không được trong tương lai.',
      }),
    bachelorSerialNumber: z
      .string()
      .trim()
      .min(1, 'Số hiệu bằng đại học là bắt buộc.')
      .max(100, 'Số hiệu bằng đại học không được vượt quá 100 ký tự.'),
    masterMajor: z
      .string()
      .trim()
      .min(2, 'Chuyên ngành thạc sĩ phải có ít nhất 2 ký tự.')
      .max(255, 'Chuyên ngành thạc sĩ không được vượt quá 255 ký tự.'),
    masterIssueDate: z
      .string({ required_error: 'Vui lòng chọn ngày cấp bằng thạc sĩ.' })
      .refine((val) => dateRegex.test(val) && !isNaN(Date.parse(val)), {
        message: 'Ngày cấp bằng thạc sĩ không hợp lệ.',
      })
      .refine((val) => new Date(val) <= new Date(), {
        message: 'Ngày cấp bằng thạc sĩ không được trong tương lai.',
      }),
    masterSerialNumber: z
      .string()
      .trim()
      .min(1, 'Số hiệu bằng thạc sĩ là bắt buộc.')
      .max(100, 'Số hiệu bằng thạc sĩ không được vượt quá 100 ký tự.'),
    consent: z.boolean().refine((val) => val === true, {
      message: 'Bạn cần đồng ý với điều khoản sử dụng thông tin để tiếp tục.',
    }),
  })
  .refine(
    (data) => {
      if (!data.bachelorIssueDate || !data.masterIssueDate) return true;
      const bDate = new Date(data.bachelorIssueDate);
      const mDate = new Date(data.masterIssueDate);
      return mDate >= bDate;
    },
    {
      message: 'Ngày cấp bằng thạc sĩ không được trước ngày cấp bằng đại học.',
      path: ['masterIssueDate'],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export const ApplicationFormPage: React.FC = () => {
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Bachelor file state
  const [bachelorFile, setBachelorFile] = useState<File | null>(null);
  const [bachelorFileError, setBachelorFileError] = useState<string | null>(null);
  const bachelorFileInputRef = useRef<HTMLInputElement>(null);

  // Master file state
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [masterFileError, setMasterFileError] = useState<string | null>(null);
  const masterFileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; summaryPdfUrl: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      cccd: '',
      cccdIssueDate: '',
      bachelorMajor: '',
      bachelorIssueDate: '',
      bachelorSerialNumber: '',
      masterMajor: '',
      masterIssueDate: '',
      masterSerialNumber: '',
      consent: true,
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleBachelorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBachelorFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setBachelorFileError('Chỉ chấp nhận tệp định dạng PDF (.pdf).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBachelorFileError('Dung lượng tệp vượt quá 5MB. Vui lòng nén hoặc chọn tệp nhỏ hơn.');
      return;
    }

    setBachelorFile(file);
  };

  const handleMasterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMasterFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMasterFileError('Chỉ chấp nhận tệp định dạng PDF (.pdf).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMasterFileError('Dung lượng tệp vượt quá 5MB. Vui lòng nén hoặc chọn tệp nhỏ hơn.');
      return;
    }

    setMasterFile(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const onSubmit = async (data: FormValues) => {
    // Validate files manually
    let hasFileError = false;
    if (!bachelorFile) {
      setBachelorFileError('Vui lòng tải lên tệp PDF bằng đại học.');
      hasFileError = true;
    }
    if (!masterFile) {
      setMasterFileError('Vui lòng tải lên tệp PDF bằng thạc sĩ.');
      hasFileError = true;
    }
    if (hasFileError) {
      toast.error('Vui lòng đính kèm đầy đủ các tệp bằng tốt nghiệp yêu cầu.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('cccd', data.cccd);
    formData.append('cccdIssueDate', data.cccdIssueDate);
    formData.append('bachelorMajor', data.bachelorMajor);
    formData.append('bachelorIssueDate', data.bachelorIssueDate);
    formData.append('bachelorSerialNumber', data.bachelorSerialNumber);
    formData.append('masterMajor', data.masterMajor);
    formData.append('masterIssueDate', data.masterIssueDate);
    formData.append('masterSerialNumber', data.masterSerialNumber);
    if (avatarFile) {
      formData.append('avatarFile', avatarFile);
    }
    formData.append('bachelorFile', bachelorFile!);
    formData.append('masterFile', masterFile!);

    try {
      const response = await submitApplicationApi(formData);
      setSuccessData({
        id: response.id,
        summaryPdfUrl: response.summaryPdfUrl,
      });
      toast.success('Hồ sơ ứng tuyển đã được gửi thành công!');
    } catch (error: any) {
      console.error('Submit error:', error);
      if (error.response?.status === 409) {
        const conflictMsg =
          error.response?.data?.message ||
          'Số CCCD này đã tồn tại trong hệ thống. Mỗi ứng viên chỉ được nộp hồ sơ một lần.';
        setError('cccd', {
          type: 'manual',
          message: conflictMsg,
        });
        toast.error(conflictMsg);
      } else {
        const errorMsg =
          error.response?.data?.message ||
          'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng kiểm tra lại đường truyền và thử lại.';
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    handleRemoveAvatar();
    setBachelorFile(null);
    setMasterFile(null);
    setBachelorFileError(null);
    setMasterFileError(null);
    reset();
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Nộp Hồ Sơ Thành Công!
          </h2>
          
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-6">
            Hồ sơ tuyển dụng của bạn đã được tiếp nhận và xử lý an toàn vào hệ thống. Tệp PDF tổng hợp đã được khởi tạo tự động.
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-8 text-left max-w-md mx-auto">
            <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Mã hồ sơ:</span>
              <span className="font-mono font-bold text-slate-800">{successData.id}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 pt-2">
              <span className="text-slate-500">Trạng thái:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Đã tiếp nhận
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={successData.summaryPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Tải / Xem PDF Tóm Tắt</span>
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span>Nộp hồ sơ khác</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Title Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
          <GraduationCap className="w-4 h-4" />
          <span>Cổng Nộp Hồ Sơ Trực Tuyến</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          HỒ SƠ ỨNG TUYỂN
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Vui lòng nhập chính xác thông tin cá nhân, ảnh chân dung và đính kèm các tệp bằng tốt nghiệp định dạng PDF.
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Thông tin cá nhân */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 transition-shadow hover:shadow-md">
          <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Thông tin cá nhân</h2>
              <p className="text-xs text-slate-500">Thông tin cơ bản và ảnh chân dung theo căn cước công dân</p>
            </div>
          </div>

          {/* Avatar Upload Box */}
          <div className="mb-6 p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <div className="w-24 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center shadow-inner">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Ảnh chân dung ứng viên"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] block font-medium leading-tight">Ảnh 3x4 / Chân dung</span>
                  </div>
                )}
              </div>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
                  title="Xóa ảnh chân dung"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Ảnh chân dung ứng viên</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tải lên ảnh chân dung rõ mặt (tỷ lệ 3x4 hoặc chân dung, tối đa 5 MB, định dạng JPG/PNG/WEBP).
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>{avatarFile ? 'Thay đổi ảnh' : 'Chọn ảnh chân dung'}</span>
                </button>

                {avatarFile && (
                  <span className="text-xs text-slate-500 font-mono">
                    {formatFileSize(avatarFile.size)}
                  </span>
                )}
              </div>

              {avatarError && (
                <p className="mt-2 text-xs text-rose-600 flex items-center justify-center sm:justify-start">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {avatarError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYỄN VĂN AN"
                  {...register('fullName')}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* CCCD */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Số CCCD (12 chữ số) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="001200xxxxxx"
                  {...register('cccd')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.cccd
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.cccd && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.cccd.message}
                </p>
              )}
            </div>

            {/* CCCD Issue Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Ngày cấp CCCD <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('cccdIssueDate')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.cccdIssueDate
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.cccdIssueDate && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.cccdIssueDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Bằng tốt nghiệp đại học */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 transition-shadow hover:shadow-md">
          <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Bằng tốt nghiệp đại học</h2>
              <p className="text-xs text-slate-500">Thông tin văn bằng tốt nghiệp bậc đại học</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Major */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Chuyên ngành đào tạo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Công nghệ thông tin / Kỹ thuật phần mềm"
                {...register('bachelorMajor')}
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.bachelorMajor
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
              />
              {errors.bachelorMajor && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.bachelorMajor.message}
                </p>
              )}
            </div>

            {/* Bachelor Issue Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Ngày cấp bằng ĐH <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('bachelorIssueDate')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.bachelorIssueDate
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.bachelorIssueDate && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.bachelorIssueDate.message}
                </p>
              )}
            </div>

            {/* Bachelor Serial Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Số hiệu bằng tốt nghiệp ĐH <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: B1234567 hoặc 2020-DH01"
                  {...register('bachelorSerialNumber')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.bachelorSerialNumber
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.bachelorSerialNumber && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.bachelorSerialNumber.message}
                </p>
              )}
            </div>

            {/* Bachelor File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tệp đính kèm bằng tốt nghiệp ĐH (PDF, ≤ 5MB) <span className="text-rose-500">*</span>
              </label>

              {!bachelorFile ? (
                <div
                  onClick={() => bachelorFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 ${
                    bachelorFileError
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    ref={bachelorFileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleBachelorFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Nhấp để chọn tệp bằng đại học hoặc kéo thả vào đây
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Định dạng hỗ trợ: Chỉ tệp .PDF (tối đa 5 MB)</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-900 truncate">{bachelorFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(bachelorFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBachelorFile(null);
                      if (bachelorFileInputRef.current) bachelorFileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"
                    title="Xóa tệp"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {bachelorFileError && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {bachelorFileError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Bằng tốt nghiệp thạc sĩ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 transition-shadow hover:shadow-md">
          <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Bằng tốt nghiệp thạc sĩ</h2>
              <p className="text-xs text-slate-500">Thông tin văn bằng tốt nghiệp bậc thạc sĩ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Master Major */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Chuyên ngành đào tạo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Khoa học máy tính / Hệ thống thông tin"
                {...register('masterMajor')}
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.masterMajor
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.masterMajor && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.masterMajor.message}
                </p>
              )}
            </div>

            {/* Master Issue Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Ngày cấp bằng ThS <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('masterIssueDate')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.masterIssueDate
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.masterIssueDate && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.masterIssueDate.message}
                </p>
              )}
            </div>

            {/* Master Serial Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Số hiệu bằng tốt nghiệp ThS <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Award className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: THS-998877"
                  {...register('masterSerialNumber')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.masterSerialNumber
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.masterSerialNumber && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {errors.masterSerialNumber.message}
                </p>
              )}
            </div>

            {/* Master File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tệp đính kèm bằng tốt nghiệp ThS (PDF, ≤ 5MB) <span className="text-rose-500">*</span>
              </label>

              {!masterFile ? (
                <div
                  onClick={() => masterFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 ${
                    masterFileError
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    ref={masterFileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleMasterFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Nhấp để chọn tệp bằng thạc sĩ hoặc kéo thả vào đây
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Định dạng hỗ trợ: Chỉ tệp .PDF (tối đa 5 MB)</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-900 truncate">{masterFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(masterFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMasterFile(null);
                      if (masterFileInputRef.current) masterFileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"
                    title="Xóa tệp"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {masterFileError && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {masterFileError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3">
          <input
            id="consent"
            type="checkbox"
            {...register('consent')}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <div className="text-sm">
            <label htmlFor="consent" className="font-medium text-slate-800 cursor-pointer">
              Tôi đồng ý cho phép sử dụng thông tin để phục vụ tuyển dụng.
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống cam kết bảo mật thông tin và chỉ sử dụng cho mục đích thẩm định hồ sơ tuyển dụng.
            </p>
            {errors.consent && (
              <p className="mt-1 text-xs text-rose-600">{errors.consent.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center space-x-2 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xử lý tải lên & tạo hồ sơ...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Xác nhận & Nộp hồ sơ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
