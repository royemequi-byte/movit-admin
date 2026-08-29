import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService, Trip } from '../../core/services/api.service';

type TripStatus = Trip['status'];

@Component({
  selector: 'app-trips-list',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">VIA<span>JES</span></h1>
          <div class="cyan-divider"></div>
        </div>
        <select class="mv-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">Todos los estados</option>
          <option value="REQUESTED">Solicitado</option>
          <option value="ASSIGNED">Asignado</option>
          <option value="DRIVER_EN_ROUTE">En camino</option>
          <option value="DRIVER_ARRIVED">Llegó</option>
          <option value="IN_PROGRESS">En curso</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (trips().length === 0) {
        <div class="mv-card mv-empty">No hay viajes con este filtro.</div>
      } @else {
        <div class="mv-card" style="padding: 0; overflow: hidden;">
          <table class="mv-table">
            <thead>
              <tr>
                <th>Pasajera</th>
                <th>Conductora</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Km</th>
                <th>Tarifa</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of trips(); track t.id) {
                <tr>
                  <td>{{ t.passenger.firstName }} {{ t.passenger.lastName }}<br><small>{{ t.passenger.phone }}</small></td>
                  <td>
                    @if (t.driver) {
                      {{ t.driver.user.firstName }} {{ t.driver.user.lastName }}
                    } @else {
                      <span style="color:#555">Sin asignar</span>
                    }
                  </td>
                  <td class="addr-cell">{{ t.originAddress }}</td>
                  <td class="addr-cell">{{ t.destAddress }}</td>
                  <td>{{ t.distanceKm ? (t.distanceKm | number:'1.1-1') + ' km' : '—' }}</td>
                  <td>{{ t.fareActual ?? t.fareEstimated ? '\$' + formatCop(t.fareActual ?? t.fareEstimated!) : '—' }}</td>
                  <td><span class="trip-status {{ t.status }}">{{ statusLabel(t.status) }}</span></td>
                  <td>{{ t.createdAt | date:'dd/MM HH:mm' }}</td>
                  <td>
                    @if (canCancel(t.status)) {
                      <button class="btn-cancel" (click)="cancel(t.id)" title="Cancelar viaje">✕</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button class="btn-outline" [disabled]="page() === 1" (click)="prevPage()">← Anterior</button>
          <span class="page-info">Página {{ page() }}</span>
          <button class="btn-outline" [disabled]="trips().length < 25" (click)="nextPage()">Siguiente →</button>
        </div>
      }

      @if (toast()) {
        <div class="fixed-toast">{{ toast() }}</div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .addr-cell { font-size: 12px; color: #888; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { font-size: 11px; color: #555; }

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

    .btn-cancel {
      width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,68,68,.3);
      background: rgba(255,68,68,.08); color: #ff4444; cursor: pointer; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
      &:hover { background: rgba(255,68,68,.2); }
    }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: flex-end; margin-top: 16px; }
    .page-info { font-size: 13px; color: #666; }

    .fixed-toast {
      position: fixed; bottom: 24px; right: 24px;
      background: #161616; border: 1px solid rgba(0,212,232,.3);
      color: #00d4e8; padding: 12px 20px; border-radius: 10px;
      font-size: 14px; z-index: 9999;
      box-shadow: 0 0 20px rgba(0,212,232,.15);
    }
  `],
})
export class TripsListComponent implements OnInit {
  private api = inject(ApiService);
  trips = signal<Trip[]>([]);
  loading = signal(true);
  statusFilter = '';
  page = signal(1);
  toast = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAdminTrips(this.statusFilter || undefined, this.page()).subscribe({
      next: (t) => { this.trips.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }

  canCancel(status: TripStatus) {
    return ['REQUESTED', 'ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED'].includes(status);
  }

  cancel(id: string) {
    if (!confirm('¿Cancelar este viaje?')) return;
    this.api.cancelAdminTrip(id, 'Cancelado por administrador').subscribe({
      next: () => {
        this.trips.update(ts => ts.map(t => t.id === id ? { ...t, status: 'CANCELLED' as TripStatus } : t));
        this.showToast('Viaje cancelado');
      },
    });
  }

  showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }

  statusLabel(s: string) {
    const map: Record<string, string> = {
      REQUESTED: 'Solicitado', ASSIGNED: 'Asignado',
      DRIVER_EN_ROUTE: 'En camino', DRIVER_ARRIVED: 'Llegó',
      IN_PROGRESS: 'En curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
    };
    return map[s] ?? s;
  }

  formatCop(n: number) {
    return new Intl.NumberFormat('es-CO').format(Math.round(n));
  }
}
