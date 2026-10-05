export interface Application {
  id: string;
  fullName: string;
  cccd: string;
  cccdIssueDate: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  bachelorMajor: string;
  bachelorIssueDate: string;
  bachelorSerialNumber: string;
  bachelorFileUrl: string;
  bachelorFilePublicId: string;
  masterMajor: string;
  masterIssueDate: string;
  masterSerialNumber: string;
  masterFileUrl: string;
  masterFilePublicId: string;
  summaryPdfUrl: string;
  summaryPdfPublicId: string;
  createdAt: string;
}

export interface ApplicationListResponse {
  data: Application[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SubmitApplicationResponse {
  message: string;
  id: string;
  summaryPdfUrl: string;
}

export interface AdminUser {
  username: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  admin: AdminUser;
}
