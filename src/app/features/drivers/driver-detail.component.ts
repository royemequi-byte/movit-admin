import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Driver } from '../../core/services/api.service';

@Component({
  selector: 'app-driver-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-container">
      <a class="back-link" routerLink="/drivers">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver a conductores
      </a>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (driver()) {
        <div class="detail-grid">

          <!-- Perfil -->
          <div class="mv-card profile-card">
            <div class="avatar">{{ initials() }}</div>
            <div class="profile-info">
              <h2 class="driver-fullname">{{ driver()!.user.firstName }} {{ driver()!.user.lastName }}</h2>
              <div class="profile-meta">
                <span>{{ driver()!.user.phone }}</span>
                @if (driver()!.user.email) { <span>{{ driver()!.user.email }}</span> }
              </div>
              <div class="stats-row">
                <div class="stat">
                  <span class="stat-val">{{ driver()!.totalTrips }}</span>
                  <span class="stat-label">Viajes</span>
                </div>
                <div class="stat">
                  <span class="stat-val">{{ driver()!.rating | number:'1.1-1' }}</span>
                  <span class="stat-label">Calificación</span>
                </div>
                <div class="stat">
                  <span class="stat-val status-badge {{ driver()!.status }}">{{ statusLabel(driver()!.status) }}</span>
                </div>
              </div>
            </div>

            <div class="action-row">
              @if (driver()!.status === 'PENDING') {
                <button class="btn-cyan" (click)="setStatus('APPROVED')">Aprobar</button>
                <button class="btn-danger" (click)="setStatus('REJECTED')">Rechazar</button>
              }
              @if (driver()!.status === 'APPROVED') {
                <button class="btn-danger" (click)="setStatus('SUSPENDED')">Suspender</button>
              }
              @if (driver()!.status === 'SUSPENDED') {
                <button class="btn-cyan" (click)="setStatus('APPROVED')">Reactivar</button>
              }
            </div>

            @if (toast()) {
              <div class="toast" [class.toast-error]="toastError()">{{ toast() }}</div>
            }
          </div>

          <!-- Documentos -->
          <div class="mv-card">
            <h3 class="section-title">Documentos</h3>
            <div class="cyan-divider" style="margin-bottom: 16px;"></div>
            @if (driver()!.documents.length === 0) {
              <div class="mv-empty">Sin documentos cargados</div>
            } @else {
              @for (doc of driver()!.documents; track doc.id) {
                <div class="doc-row">
                  <div class="doc-info">
                    <div class="doc-type">{{ docLabel(doc.type) }}</div>
                    @if (doc.expiresAt) {
                      <div class="doc-expire" [class.doc-urgent]="isExpiringSoon(doc.expiresAt)">
                        Vence {{ doc.expiresAt | date:'dd/MM/yyyy' }}
                        @if (isExpiringSoon(doc.expiresAt)) { · Urgente }
                      </div>
                    }
                  </div>
                  <div class="doc-actions">
                    @if (doc.isVerified) {
                      <span class="verified-badge">Verificado</span>
                    } @else {
                      <button class="btn-verify" (click)="verifyDoc(doc.id, true)">Verificar</button>
                    }
                    @if (doc.fileUrl) {
                      <a [href]="doc.fileUrl" target="_blank" class="btn-file">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Vehículos -->
          <div class="mv-card">
            <h3 class="section-title">Vehículos</h3>
            <div class="cyan-divider" style="margin-bottom: 16px;"></div>
            @if (driver()!.vehicles.length === 0) {
              <div class="mv-empty">Sin vehículos registrados</div>
            } @else {
              @for (v of driver()!.vehicles; track v.id) {
                <div class="vehicle-row">
                  <div class="vehicle-icon">
                    @if (v.type === 'CAR') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="11" width="20" height="8" rx="2"/><path d="M5 11V8a7 7 0 0 1 14 0v3"/><circle cx="7" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M5 15V9l4-4h6l4 4v6"/></svg>
                    }
                  </div>
                  <div>
                    <div class="vehicle-name">{{ v.brand }} {{ v.model }} {{ v.year }}</div>
                    <div class="vehicle-meta">{{ v.plate }} · {{ v.color }}</div>
                  </div>
                  <span class="vehicle-type-badge">{{ v.type === 'CAR' ? 'Carro' : 'Moto' }}</span>
                </div>
              }
            }
          </div>
        </div>
      } @else {
        <div class="mv-card mv-empty">Conductor/a no encontrado/a.</div>
      }
    </div>
  `,
  styles: [`
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: #666; font-size: 14px; text-decoration: none; margin-bottom: 24px;
      svg { width: 16px; height: 16px; }
      &:hover { color: #00d4e8; }
    }

    .detail-grid { display: flex; flex-direction: column; gap: 16px; }

    .profile-card {
      display: grid; grid-template-columns: auto 1fr; gap: 20px; align-items: start;
    }

    .avatar {
      width: 60px; height: 60px; border-radius: 50%;
      background: rgba(0,212,232,.15); border: 2px solid #00d4e8;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700; color: #00d4e8;
    }

    .driver-fullname {
      font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700;
      color: #fff; letter-spacing: .5px;
    }

    .profile-meta { display: flex; gap: 16px; margin-top: 4px; }
    .profile-meta span { font-size: 13px; color: #666; }

    .stats-row { display: flex; align-items: center; gap: 24px; margin-top: 12px; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; }
    .stat-val { font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700; color: #fff; }
    .stat-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: .5px; }

    .action-row {
      grid-column: 1 / -1; display: flex; gap: 12px; padding-top: 16px;
      border-top: 1px solid #1e1e1e; margin-top: 8px;
    }

    .toast {
      grid-column: 1 / -1; padding: 10px 14px; border-radius: 8px;
      background: rgba(0,230,118,.1); border: 1px solid rgba(0,230,118,.3);
      color: #00e676; font-size: 13px;
      &.toast-error { background: rgba(255,68,68,.1); border-color: rgba(255,68,68,.3); color: #ff4444; }
    }

    .section-title {
      font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700;
      color: #fff; letter-spacing: 1px; text-transform: uppercase;
    }

    .doc-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #1a1a1a;
      &:last-child { border-bottom: none; }
    }
    .doc-type { font-size: 14px; color: #ccc; font-weight: 500; }
    .doc-expire { font-size: 12px; color: #666; margin-top: 3px; }
    .doc-urgent { color: #ff8a00; }
    .doc-actions { display: flex; align-items: center; gap: 8px; }
    .verified-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: rgba(0,230,118,.12); color: #00e676; border: 1px solid rgba(0,230,118,.3);
    }
    .btn-verify {
      padding: 5px 12px; border-radius: 6px; background: rgba(0,212,232,.1);
      color: #00d4e8; border: 1px solid rgba(0,212,232,.3);
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: background .2s;
      &:hover { background: rgba(0,212,232,.2); }
    }
    .btn-file {
      width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center;
      justify-content: center; background: #1e1e1e; color: #888;
      svg { width: 15px; height: 15px; }
      &:hover { background: #252525; color: #fff; }
    }

    .vehicle-row {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 0; border-bottom: 1px solid #1a1a1a;
      &:last-child { border-bottom: none; }
    }
    .vehicle-icon {
      width: 40px; height: 40px; border-radius: 8px; background: #1a1a1a;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      svg { width: 20px; height: 20px; color: #00d4e8; }
    }
    .vehicle-name { font-size: 14px; color: #ccc; font-weight: 500; }
    .vehicle-meta { font-size: 12px; color: #555; margin-top: 2px; }
    .vehicle-type-badge {
      margin-left: auto; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: rgba(0,212,232,.08); color: #00d4e8; border: 1px solid rgba(0,212,232,.2);
    }
  `],
})
export class DriverDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  driver = signal<Driver | null>(null);
  loading = signal(true);
  toast = signal('');
  toastError = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getDriver(id).subscribe({
      next: (d) => { this.driver.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  initials() {
    const d = this.driver();
    if (!d) return '?';
    return (d.user.firstName[0] ?? '') + (d.user.lastName[0] ?? '');
  }

  statusLabel(s: string) {
    const map: Record<string, string> = {
      PENDING: 'Pendiente', APPROVED: 'Aprobada',
      SUSPENDED: 'Suspendida', REJECTED: 'Rechazada',
    };
    return map[s] ?? s;
  }

  docLabel(type: string) {
    const map: Record<string, string> = {
      SOAT: 'SOAT', LICENSE: 'Licencia de conducción',
      TECH_REVIEW: 'Revisión técnico-mecánica',
      INSURANCE: 'Seguro todo riesgo',
      PROPERTY_CARD: 'Tarjeta de propiedad',
    };
    return map[type] ?? type;
  }

  isExpiringSoon(date?: string) {
    if (!date) return false;
    return new Date(date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  }

  setStatus(status: string) {
    const id = this.driver()!.id;
    this.api.updateDriverStatus(id, status).subscribe({
      next: () => {
        this.driver.update(d => d ? { ...d, status: status as Driver['status'] } : d);
        this.showToast('Estado actualizado correctamente', false);
      },
      error: () => this.showToast('Error actualizando estado', true),
    });
  }

  verifyDoc(docId: string, isVerified: boolean) {
    this.api.verifyDocument(docId, isVerified).subscribe({
      next: () => {
        this.driver.update(d => d ? {
          ...d,
          documents: d.documents.map(doc => doc.id === docId ? { ...doc, isVerified } : doc),
        } : d);
        this.showToast('Documento verificado', false);
      },
      error: () => this.showToast('Error verificando documento', true),
    });
  }

  private showToast(msg: string, isError: boolean) {
    this.toast.set(msg);
    this.toastError.set(isError);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
