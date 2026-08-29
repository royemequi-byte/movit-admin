import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Driver {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  isAvailable: boolean;
  rating: number;
  totalTrips: number;
  createdAt: string;
  user: { firstName: string; lastName: string; phone: string; email: string; photoUrl?: string };
  documents: Document[];
  vehicles: Vehicle[];
}

export interface Document {
  id: string;
  driverId: string;
  type: string;
  fileUrl: string;
  expiresAt?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  type: 'CAR' | 'MOTORCYCLE';
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  // Auth
  sendOtp(phone: string) {
    return this.http.post(`${this.base}/auth/send-otp`, { phone });
  }

  verifyOtp(phone: string, token: string) {
    return this.http.post<{ accessToken: string; user: { role: string } }>(
      `${this.base}/auth/verify-otp`, { phone, token }
    );
  }

  // Admin — drivers
  getDrivers(status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Driver[]>(`${this.base}/admin/drivers`, { headers: this.headers, params });
  }

  getDriver(id: string) {
    return this.http.get<Driver>(`${this.base}/admin/drivers/${id}`, { headers: this.headers });
  }

  updateDriverStatus(id: string, status: string) {
    return this.http.patch(`${this.base}/admin/drivers/${id}/status`, { status }, { headers: this.headers });
  }

  // Admin — documents
  verifyDocument(id: string, isVerified: boolean) {
    return this.http.patch(`${this.base}/admin/documents/${id}/verify`, { isVerified }, { headers: this.headers });
  }

  getExpiringDocuments(days = 30) {
    return this.http.get<Document[]>(`${this.base}/admin/documents/expiring?days=${days}`, { headers: this.headers });
  }
}
