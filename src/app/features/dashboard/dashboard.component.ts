import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardStats, Trip } from '../../core/services/api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page-container">
      <div>
        <h1 class="page-title">DASH<span>BOARD</span></h1>
        <div class="cyan-divider"></div>
      </div>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (stats()) {
        <div class="kpi-grid">
          <!-- Viajes activos -->
          <div class="kpi-card kpi-active">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="kpi-val">{{ stats()!.trips.active }}</div>
              <div class="kpi-label">Viajes activos</div>
            </div>
          </div>

          <!-- Completados hoy -->
          <div class="kpi-card kpi-success">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="kpi-val">{{ stats()!.trips.completedToday }}</div>
              <div class="kpi-label">Completados hoy</div>
            </div>
          </div>

          <!-- Revenue hoy -->
          <div class="kpi-card kpi-revenue">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <div class="kpi-val">\${{ formatCop(stats()!.revenue.today) }}</div>
              <div class="kpi-label">Ingresos hoy</div>
            </div>
          </div>

          <!-- Conductoras pendientes -->
          <div class="kpi-card kpi-warning">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div>
              <div class="kpi-val">{{ stats()!.drivers.pending }}</div>
              <div class="kpi-label">Conductoras pendientes</div>
              <a class="kpi-action" routerLink="/drivers" [queryParams]="{status:'PENDING'}">Revisar →</a>
            </div>
          </div>

          <!-- Total conductoras -->
          <div class="kpi-card">
            <div class="kpi-icon cyan-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div class="kpi-val">{{ stats()!.drivers.approved }}</div>
              <div class="kpi-label">Conductoras activas</div>
              <div class="kpi-sub">{{ stats()!.drivers.total }} registradas total</div>
            </div>
          </div>

          <!-- Total viajes -->
          <div class="kpi-card">
            <div class="kpi-icon cyan-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="11" width="20" height="8" rx="2"/><path d="M5 11V8a7 7 0 0 1 14 0v3"/></svg>
            </div>
            <div>
              <div class="kpi-val">{{ stats()!.trips.total }}</div>
              <div class="kpi-label">Viajes totales</div>
              <div class="kpi-sub">{{ stats()!.trips.cancelledToday }} cancelados hoy</div>
            </div>
          </div>
        </div>

        <!-- Recent trips -->
        <div style="margin-top: 32px;">
          <h2 class="section-heading">Últimos viajes</h2>
          @if (loadingTrips()) {
            <div class="mv-spinner" style="padding: 32px;"><div class="spinner"></div></div>
          } @else if (recentTrips().length === 0) {
            <div class="mv-card mv-empty">Sin viajes registrados aún.</div>
          } @else {
            <div class="mv-card" style="padding: 0; overflow: hidden;">
              <table class="mv-table">
                <thead>
                  <tr>
                    <th>Pasajera</th>
                    <th>Conductora</th>
                    <th>Ruta</th>
                    <th>Tarifa</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of recentTrips(); track t.id) {
                    <tr>
                      <td>{{ t.passenger.firstName }} {{ t.passenger.lastName }}</td>
                      <td>{{ t.driver?.user?.firstName ?? '—' }} {{ t.driver?.user?.lastName ?? '' }}</td>
                      <td class="route-cell">
                        <span class="route-origin">{{ shortAddr(t.originAddress) }}</span>
                        <span class="route-arrow">→</span>
                        <span class="route-dest">{{ shortAddr(t.destAddress) }}</span>
                      </td>
                      <td>{{ t.fareActual ?? t.fareEstimated ? '\$' + formatCop(t.fareActual ?? t.fareEstimated!) : '—' }}</td>
                      <td><span class="trip-status {{ t.status }}">{{ tripStatusLabel(t.status) }}</span></td>
                      <td>{{ t.createdAt | date:'dd/MM HH:mm' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div style="text-align: right; margin-top: 12px;">
              <a class="btn-outline" style="font-size:13px; padding: 7px 16px;" routerLink="/trips">Ver todos los viajes →</a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: #161616; border: 1px solid #252525; border-radius: 12px;
      padding: 20px; display: flex; gap: 16px; align-items: flex-start;
      transition: border-color .2s;
      &:hover { border-color: rgba(0,212,232,.2); }
    }
    .kpi-active  { border-color: rgba(0,212,232,.2); }
    .kpi-success { border-color: rgba(0,230,118,.2); }
    .kpi-revenue { border-color: rgba(0,212,232,.15); }
    .kpi-warning { border-color: rgba(255,171,0,.2); }

    .kpi-icon {
      width: 42px; height: 42px; border-radius: 10px; background: #1e1e1e;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      svg { width: 20px; height: 20px; color: #555; }
    }
    .cyan-icon svg { color: #00d4e8; }
    .kpi-active svg { color: #00d4e8; }
    .kpi-success svg { color: #00e676; }
    .kpi-revenue svg { color: #00d4e8; }
    .kpi-warning svg { color: #ffab00; }

    .kpi-val {
      font-family: 'Rajdhani', sans-serif; font-size: 30px; font-weight: 700; color: #fff;
      line-height: 1;
    }
    .kpi-label { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: .5px; }
    .kpi-sub { font-size: 11px; color: #444; margin-top: 2px; }
    .kpi-action { font-size: 11px; color: #ffab00; display: inline-block; margin-top: 4px; text-decoration: none; &:hover { color: #ffd966; } }

    .section-heading {
      font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700;
      color: #888; letter-spacing: 2px; text-transform: uppercase;
      margin-bottom: 12px;
    }

    .route-cell { font-size: 12px; max-width: 200px; }
    .route-origin { color: #888; }
    .route-arrow { color: #00d4e8; margin: 0 4px; }
    .route-dest { color: #ccc; }

    .trip-status {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 10px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase;

      &.REQUESTED    { background: rgba(0,212,232,.1);  color: #00d4e8; border: 1px solid rgba(0,212,232,.3); }
      &.ASSIGNED     { background: rgba(255,171,0,.1);  color: #ffab00; border: 1px solid rgba(255,171,0,.3); }
      &.DRIVER_EN_ROUTE, &.DRIVER_ARRIVED { background: rgba(255,171,0,.12); color: #ffcc44; border: 1px solid rgba(255,171,0,.3); }
      &.IN_PROGRESS  { background: rgba(0,212,232,.12); color: #00d4e8; border: 1px solid rgba(0,212,232,.4); }
      &.COMPLETED    { background: rgba(0,230,118,.12); color: #00e676; border: 1px solid rgba(0,230,118,.3); }
      &.CANCELLED    { background: rgba(255,68,68,.1);  color: #ff4444; border: 1px solid rgba(255,68,68,.3); }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<DashboardStats | null>(null);
  recentTrips = signal<Trip[]>([]);
  loading = signal(true);
  loadingTrips = signal(true);

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.getAdminTrips().subscribe({
      next: (t) => { this.recentTrips.set(t.slice(0, 8)); this.loadingTrips.set(false); },
      error: () => this.loadingTrips.set(false),
    });
  }

  formatCop(n: number) {
    return new Intl.NumberFormat('es-CO').format(Math.round(n));
  }

  shortAddr(addr: string) {
    return addr.length > 28 ? addr.slice(0, 28) + '…' : addr;
  }

  tripStatusLabel(s: string) {
    const map: Record<string, string> = {
      REQUESTED: 'Solicitado', ASSIGNED: 'Asignado',
      DRIVER_EN_ROUTE: 'En camino', DRIVER_ARRIVED: 'Llegó',
      IN_PROGRESS: 'En curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
    };
    return map[s] ?? s;
  }
}
