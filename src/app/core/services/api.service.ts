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

export interface Trip {
  id: string;
  status: 'REQUESTED' | 'ASSIGNED' | 'DRIVER_EN_ROUTE' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  originAddress: string;
  destAddress: string;
  distanceKm?: number;
  fareEstimated?: number;
  fareActual?: number;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  passenger: { firstName: string; lastName: string; phone: string };
  driver?: { user: { firstName: string; lastName: string; phone: string } } | null;
  vehicle?: { type: string; plate: string; brand: string; model: string } | null;
}

export interface DashboardStats {
  drivers: { total: number; pending: number; approved: number };
  trips: { active: number; completedToday: number; cancelledToday: number; total: number };
  revenue: { today: number };
}

export interface FareConfig {
  id: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  baseAmount: number;
  perKmAmount: number;
  perMinuteAmount: number;
  minimumAmount: number;
  nightMultiplier: number;
  isActive: boolean;
}

export interface FareConfigInput {
  vehicleType: 'CAR' | 'MOTORCYCLE';
  baseAmount: number;
  perKmAmount: number;
  perMinuteAmount: number;
  minimumAmount: number;
  nightMultiplier: number;
}

export interface PriceDestination {
  id: string;
  name: string;
  section: string;
  price: number;
  isActive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxFareAmount: number | null;
  daysOfWeek: number[];
  startHour: number | null;
  endHour: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
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

  // Admin — dashboard
  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.base}/admin/stats`, { headers: this.headers });
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

  // Admin — trips
  getAdminTrips(status?: string, page = 1) {
    let params = new HttpParams().set('page', page).set('limit', 25);
    if (status) params = params.set('status', status);
    return this.http.get<Trip[]>(`${this.base}/admin/trips`, { headers: this.headers, params });
  }

  getAdminTrip(id: string) {
    return this.http.get<Trip>(`${this.base}/admin/trips/${id}`, { headers: this.headers });
  }

  cancelAdminTrip(id: string, reason?: string) {
    return this.http.post(`${this.base}/admin/trips/${id}/cancel`, { reason }, { headers: this.headers });
  }

  // Admin — fare config
  getFareConfig() {
    return this.http.get<FareConfig[]>(`${this.base}/admin/fare-config`, { headers: this.headers });
  }

  upsertFareConfig(input: FareConfigInput) {
    return this.http.post<FareConfig>(`${this.base}/admin/fare-config`, input, { headers: this.headers });
  }

  // Admin — price destinations
  getPriceDestinations() {
    return this.http.get<PriceDestination[]>(`${this.base}/admin/price-destinations`, { headers: this.headers });
  }

  createPriceDestination(data: { name: string; section: string; price: number }) {
    return this.http.post<PriceDestination>(`${this.base}/admin/price-destinations`, data, { headers: this.headers });
  }

  updatePriceDestination(id: string, data: Partial<{ name: string; section: string; price: number }>) {
    return this.http.patch<PriceDestination>(`${this.base}/admin/price-destinations/${id}`, data, { headers: this.headers });
  }

  deletePriceDestination(id: string) {
    return this.http.delete(`${this.base}/admin/price-destinations/${id}`, { headers: this.headers });
  }

  // Admin — campaigns
  getCampaigns() {
    return this.http.get<Campaign[]>(`${this.base}/admin/campaigns`, { headers: this.headers });
  }

  createCampaign(data: object) {
    return this.http.post<Campaign>(`${this.base}/admin/campaigns`, data, { headers: this.headers });
  }

  updateCampaign(id: string, data: object) {
    return this.http.patch<Campaign>(`${this.base}/admin/campaigns/${id}`, data, { headers: this.headers });
  }

  deleteCampaign(id: string) {
    return this.http.delete(`${this.base}/admin/campaigns/${id}`, { headers: this.headers });
  }
}
