import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Driver } from '../../core/services/api.service';

@Component({
  selector: 'app-drivers-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">CONDUCTO<span>RAS</span></h1>
          <div class="cyan-divider"></div>
        </div>
        <select class="mv-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="SUSPENDED">Suspendidas</option>
          <option value="REJECTED">Rechazadas</option>
        </select>
      </div>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (drivers().length === 0) {
        <div class="mv-card mv-empty">No hay conductores con este filtro.</div>
      } @else {
        <div class="mv-card" style="padding: 0; overflow: hidden;">
          <table class="mv-table">
            <thead>
              <tr>
                <th>Conductor/a</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Docs</th>
                <th>Vehículos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (d of drivers(); track d.id) {
                <tr>
                  <td>
                    <div class="driver-name">{{ d.user.firstName }} {{ d.user.lastName }}</div>
                    @if (d.user.email) { <div class="driver-email">{{ d.user.email }}</div> }
                  </td>
                  <td>{{ d.user.phone }}</td>
                  <td><span class="status-badge {{ d.status }}">{{ statusLabel(d.status) }}</span></td>
                  <td>{{ d.documents.length }}</td>
                  <td>{{ d.vehicles.length }}</td>
                  <td>
                    <a class="btn-view" [routerLink]="['/drivers', d.id]">Ver</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 8px;
    }
    .driver-name { font-weight: 500; }
    .driver-email { font-size: 12px; color: #666; margin-top: 2px; }
    .btn-view {
      padding: 6px 14px; border-radius: 6px;
      background: rgba(0,212,232,.1); color: #00d4e8;
      border: 1px solid rgba(0,212,232,.3);
      font-size: 12px; font-weight: 600;
      text-decoration: none; cursor: pointer;
      letter-spacing: .5px;
      transition: background .2s, box-shadow .2s;
      &:hover { background: rgba(0,212,232,.2); box-shadow: 0 0 8px rgba(0,212,232,.3); }
    }
  `],
})
export class DriversListComponent implements OnInit {
  private api = inject(ApiService);
  drivers = signal<Driver[]>([]);
  loading = signal(true);
  statusFilter = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getDrivers(this.statusFilter || undefined).subscribe({
      next: (d) => { this.drivers.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: string) {
    const map: Record<string, string> = {
      PENDING: 'Pendiente', APPROVED: 'Aprobada',
      SUSPENDED: 'Suspendida', REJECTED: 'Rechazada',
    };
    return map[s] ?? s;
  }
}
