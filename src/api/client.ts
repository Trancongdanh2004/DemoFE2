import axios from 'axios';
import {
  ApplicationListResponse,
  Application,
  SubmitApplicationResponse,
  LoginResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for Cloudinary uploads
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on admin page, remove token
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public API
export const submitApplicationApi = async (formData: FormData): Promise<SubmitApplicationResponse> => {
  const res = await apiClient.post<SubmitApplicationResponse>('/applications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// Admin API
export const adminLoginApi = async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/admin/login', credentials);
  return res.data;
};

export const getApplicationsApi = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApplicationListResponse> => {
  const res = await apiClient.get<ApplicationListResponse>('/admin/applications', { params });
  return res.data;
};

export const getApplicationByIdApi = async (id: string): Promise<Application> => {
  const res = await apiClient.get<Application>(`/admin/applications/${id}`);
  return res.data;
};

export const deleteApplicationApi = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/admin/applications/${id}`);
  return res.data;
};

export const exportApplicationsExcelApi = async (search?: string): Promise<Blob> => {
  const res = await apiClient.get('/admin/applications/export', {
    params: { search },
    responseType: 'blob',
  });
  return res.data;
};
