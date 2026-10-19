import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Driver, DriverPayment } from '../../core/services/api.service';

@Component({
  selector: 'app-driver-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="page-container">
      <a class="back-link" routerLink="/drivers">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver
      </a>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (driver()) {

        <!-- Header perfil -->
        <div class="profile-header">
          <div class="avatar">{{ initials() }}</div>
          <div class="profile-info">
            <div class="profile-name">{{ driver()!.user.firstName }} {{ driver()!.user.lastName }}</div>
            <div class="profile-meta">
              <span>{{ driver()!.user.phone }}</span>
              @if (driver()!.user.email) { <span>{{ driver()!.user.email }}</span> }
            </div>
            <div class="profile-stats">
              <div class="pstat"><span class="pstat-val">{{ driver()!.totalTrips }}</span><span class="pstat-label">Viajes</span></div>
              <div class="pstat"><span class="pstat-val">{{ driver()!.rating | number:'1.1-1' }}</span><span class="pstat-label">Calificación</span></div>
              <span class="status-badge {{ driver()!.status }}">{{ statusLabel(driver()!.status) }}</span>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="action-bar">
          @if (driver()!.status === 'PENDING') {
            <button class="btn-cyan" (click)="setStatus('APPROVED')">✓ Aprobar</button>
            <button class="btn-danger" (click)="setStatus('REJECTED')">✕ Rechazar</button>
          }
          @if (driver()!.status === 'APPROVED') {
            <button class="btn-danger" (click)="setStatus('SUSPENDED')">Suspender</button>
          }
          @if (driver()!.status === 'SUSPENDED' || driver()!.status === 'SUSPENDED_PAYMENT') {
            <button class="btn-cyan" (click)="setStatus('APPROVED')">↺ Reactivar</button>
          }
          <button class="btn-ghost" (click)="showPwdForm.set(!showPwdForm())">🔑 Contraseña</button>
        </div>

        @if (showPwdForm()) {
          <div class="pwd-form mv-card">
            <input class="mv-input" type="password" [(ngModel)]="newPassword" placeholder="Nueva contraseña (mín. 6 chars)" />
            <button class="btn-cyan" (click)="resetPassword()" [disabled]="savingPwd() || newPassword.length < 6">
              {{ savingPwd() ? 'Guardando…' : 'Guardar' }}
            </button>
            <button class="btn-ghost" (click)="showPwdForm.set(false); newPassword=''">Cancelar</button>
          </div>
        }

        @if (toast()) {
          <div class="toast" [class.toast-error]="toastError()">{{ toast() }}</div>
        }

        <!-- Pestañas -->
        <div class="tabs">
          <button class="tab" [class.active]="tab() === 'general'" (click)="tab.set('general')">General</button>
          <button class="tab" [class.active]="tab() === 'documentos'" (click)="tab.set('documentos')">
            Documentos
            @if (pendingDocs() > 0) { <span class="tab-badge">{{ pendingDocs() }}</span> }
          </button>
          <button class="tab" [class.active]="tab() === 'pagos'" (click)="switchPagos()">
            Pagos
            @if (pendingPayments() > 0) { <span class="tab-badge amber">{{ pendingPayments() }}</span> }
          </button>
        </div>

        <!-- TAB GENERAL -->
        @if (tab() === 'general') {
          <div class="mv-card">
            <div class="section-title">Vehículos</div>
            <div class="cyan-divider"></div>
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
                  <span class="vehicle-badge">{{ v.type === 'CAR' ? 'Carro' : 'Moto' }}</span>
                </div>
              }
            }
          </div>
        }

        <!-- TAB DOCUMENTOS -->
        @if (tab() === 'documentos') {
          <div class="mv-card">
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
                        @if (isExpiringSoon(doc.expiresAt)) { · ⚠ Urgente }
                      </div>
                    }
                  </div>
                  <div class="doc-actions">
                    @if (doc.isVerified) {
                      <span class="verified-badge">✓ Verificado</span>
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
        }

        <!-- TAB PAGOS -->
        @if (tab() === 'pagos') {
          <div class="pagos-header">
            <div class="pagos-stats">
              <div class="pstat-box">
                <div class="pstat-val cyan">{{ ingresoConfirmed() ? '✓' : '—' }}</div>
                <div class="pstat-label">Afiliación $150k</div>
              </div>
              <div class="pstat-box">
                <div class="pstat-val cyan">{{ rodamientosConfirmed() }}</div>
                <div class="pstat-label">Rodamientos pagados</div>
              </div>
              <div class="pstat-box">
                <div class="pstat-val amber">{{ pendingPayments() }}</div>
                <div class="pstat-label">Pendientes</div>
              </div>
              <div class="pstat-box">
                <div class="pstat-val green">{{ totalPagado() | number:'1.0-0' }}</div>
                <div class="pstat-label">Total pagado</div>
              </div>
            </div>
            <button class="btn-register" (click)="registrarSemana()">
              {{ registeringWeek() ? 'Registrando…' : '＋ Registrar semana' }}
            </button>
          </div>

          @if (loadingPayments()) {
            <div class="mv-spinner"><div class="spinner"></div></div>
          } @else if (payments().length === 0) {
            <div class="mv-card mv-empty">Sin pagos registrados aún.</div>
          } @else {
            <div class="mv-card" style="padding:0;overflow:hidden">
              <table class="mv-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Semana</th>
                    <th>Referencia</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of payments(); track p.id) {
                    <tr>
                      <td>
                        <span class="type-pill" [class.ingreso]="p.type === 'INGRESO'">
                          {{ p.type === 'INGRESO' ? '💳 Afiliación' : '🔄 Rodamiento' }}
                        </span>
                      </td>
                      <td><span class="amount">{{ p.amount | number:'1.0-0' }}</span></td>
                      <td>
                        @if (p.weekStart) {
                          <span class="week-label">{{ weekLabel(p.weekStart) }}</span>
                        } @else { <span class="muted">—</span> }
                      </td>
                      <td>
                        @if (p.referenceNumber) {
                          <span class="ref-val">{{ p.referenceNumber }}</span>
                        } @else { <span class="muted">Sin referencia</span> }
                      </td>
                      <td>
                        <span class="status-pill {{ p.status.toLowerCase() }}">
                          <span class="sdot"></span>{{ statusPayLabel(p.status) }}
                        </span>
                      </td>
                      <td><span class="muted">{{ p.createdAt | date:'dd/MM/yy' }}</span></td>
                      <td>
                        @if (p.status === 'PENDING') {
                          <div class="row-actions">
                            <button class="btn-confirm-sm" (click)="confirmPayment(p.id)">✓</button>
                            <button class="btn-reject-sm" (click)="rejectPayment(p.id)">✕</button>
                          </div>
                        } @else if (p.status === 'CONFIRMED') {
                          <span class="ok-label">Confirmado ✓</span>
                        } @else {
                          <span class="muted">Rechazado</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      } @else {
        <div class="mv-card mv-empty">Conductor/a no encontrado/a.</div>
      }
    </div>
  `,
  styles: [`
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: #555; font-size: 13px; text-decoration: none; margin-bottom: 20px;
      svg { width: 15px; height: 15px; }
      &:hover { color: #00d4e8; }
    }

    /* Header */
    .profile-header {
      display: flex; gap: 18px; align-items: flex-start;
      background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 14px;
      padding: 20px; margin-bottom: 12px;
    }
    .avatar {
      width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
      background: rgba(0,212,232,.12); border: 2px solid rgba(0,212,232,.4);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700; color: #00d4e8;
    }
    .profile-name {
      font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700; color: #fff;
    }
    .profile-meta { display: flex; gap: 14px; margin-top: 4px; }
    .profile-meta span { font-size: 12px; color: #555; }
    .profile-stats { display: flex; align-items: center; gap: 20px; margin-top: 10px; flex-wrap: wrap; }
    .pstat { display: flex; flex-direction: column; }
    .pstat-val { font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700; color: #fff; }
    .pstat-label { font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: .5px; }

    /* Action bar */
    .action-bar {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;
    }
    .btn-ghost {
      padding: 7px 14px; border-radius: 8px; background: transparent;
      border: 1px solid #2a2a2a; color: #777; font-size: 12px; font-weight: 600; cursor: pointer;
      &:hover { border-color: #444; color: #bbb; }
    }
    .pwd-form {
      display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px;
      .mv-input { max-width: 220px; }
    }
    .toast {
      padding: 10px 14px; border-radius: 8px; margin-bottom: 12px;
      background: rgba(0,230,118,.1); border: 1px solid rgba(0,230,118,.3); color: #00e676; font-size: 13px;
      &.toast-error { background: rgba(255,68,68,.1); border-color: rgba(255,68,68,.3); color: #ff4444; }
    }

    /* Tabs */
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; border-bottom: 1px solid #1a1a1a; padding-bottom: 0; }
    .tab {
      padding: 9px 18px; background: none; border: none; border-bottom: 2px solid transparent;
      color: #444; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      display: flex; align-items: center; gap: 6px; transition: color .15s;
      &:hover { color: #888; }
      &.active { color: #00d4e8; border-bottom-color: #00d4e8; }
    }
    .tab-badge {
      background: #ff4444; color: #fff; border-radius: 99px;
      font-size: 10px; font-weight: 700; padding: 1px 6px;
      &.amber { background: #ffab00; color: #000; }
    }

    /* Docs */
    .doc-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #141414;
      &:last-child { border-bottom: none; }
    }
    .doc-type { font-size: 13px; color: #ccc; font-weight: 500; }
    .doc-expire { font-size: 11px; color: #555; margin-top: 3px; }
    .doc-urgent { color: #ff8a00; }
    .doc-actions { display: flex; align-items: center; gap: 8px; }
    .verified-badge {
      padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: rgba(0,230,118,.1); color: #00e676; border: 1px solid rgba(0,230,118,.25);
    }
    .btn-verify {
      padding: 4px 11px; border-radius: 6px; background: rgba(0,212,232,.1);
      color: #00d4e8; border: 1px solid rgba(0,212,232,.3); font-size: 11px;
      font-weight: 600; cursor: pointer;
      &:hover { background: rgba(0,212,232,.2); }
    }
    .btn-file {
      width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center;
      justify-content: center; background: #1a1a1a; color: #666; text-decoration: none;
      svg { width: 14px; height: 14px; }
      &:hover { color: #fff; background: #222; }
    }

    /* Vehicles */
    .vehicle-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid #141414;
      &:last-child { border-bottom: none; }
    }
    .vehicle-icon {
      width: 38px; height: 38px; border-radius: 8px; background: #1a1a1a; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      svg { width: 18px; height: 18px; color: #00d4e8; }
    }
    .vehicle-name { font-size: 13px; color: #ccc; font-weight: 500; }
    .vehicle-meta { font-size: 11px; color: #444; margin-top: 2px; }
    .vehicle-badge {
      margin-left: auto; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: rgba(0,212,232,.08); color: #00d4e8; border: 1px solid rgba(0,212,232,.2);
    }

    /* Pagos */
    .pagos-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px; margin-bottom: 14px;
    }
    .pagos-stats { display: flex; gap: 10px; flex-wrap: wrap; }
    .pstat-box {
      background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px;
      padding: 10px 16px; min-width: 100px; text-align: center;
    }
    .pstat-box .pstat-val { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; color: #fff; }
    .pstat-box .pstat-val.cyan { color: #00d4e8; }
    .pstat-box .pstat-val.amber { color: #ffab00; }
    .pstat-box .pstat-val.green { color: #00d464; }
    .pstat-box .pstat-label { font-size: 10px; color: #444; margin-top: 3px; text-transform: uppercase; letter-spacing: .4px; }

    .btn-register {
      padding: 10px 18px; border-radius: 8px; background: rgba(0,212,232,.1);
      border: 1px solid rgba(0,212,232,.3); color: #00d4e8; font-size: 13px;
      font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap;
      &:hover { background: rgba(0,212,232,.2); }
    }

    .type-pill {
      font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 20px;
      background: rgba(0,212,232,.08); color: #00d4e8; border: 1px solid rgba(0,212,232,.15);
      white-space: nowrap;
      &.ingreso { background: rgba(255,171,0,.08); color: #ffab00; border-color: rgba(255,171,0,.2); }
    }
    .amount { font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 800; color: #00d4e8; }
    .week-label { font-size: 12px; color: #888; white-space: nowrap; }
    .ref-val { font-family: 'Orbitron', sans-serif; font-size: 11px; color: #a0e878; letter-spacing: .5px; }
    .muted { color: #2a2a2a; font-size: 12px; font-style: italic; }
    .ok-label { font-size: 12px; color: #00d464; font-weight: 600; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px;
      border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap;
      &.pending { background: rgba(255,171,0,.1); color: #ffab00; border: 1px solid rgba(255,171,0,.2); }
      &.confirmed { background: rgba(0,212,100,.1); color: #00d464; border: 1px solid rgba(0,212,100,.2); }
      &.rejected { background: rgba(255,68,68,.1); color: #ff6666; border: 1px solid rgba(255,68,68,.2); }
    }
    .sdot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

    .row-actions { display: flex; gap: 4px; }
    .btn-confirm-sm {
      padding: 4px 10px; border-radius: 6px; background: rgba(0,212,100,.1);
      border: 1px solid rgba(0,212,100,.25); color: #00d464; font-size: 12px;
      font-weight: 700; cursor: pointer;
      &:hover { background: rgba(0,212,100,.2); }
    }
    .btn-reject-sm {
      padding: 4px 8px; border-radius: 6px; background: transparent;
      border: 1px solid #1e1e1e; color: #555; font-size: 12px; cursor: pointer;
      &:hover { border-color: #ff4444; color: #ff6666; }
    }

    .section-title {
      font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700;
      color: #fff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;
    }
    .cyan-divider { height: 2px; width: 32px; background: #00d4e8; margin-bottom: 14px; }
  `],
})
export class DriverDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  driver = signal<Driver | null>(null);
  loading = signal(true);
  toast = signal('');
  toastError = signal(false);
  showPwdForm = signal(false);
  savingPwd = signal(false);
  newPassword = '';

  tab = signal<'general' | 'documentos' | 'pagos'>('general');

  payments = signal<DriverPayment[]>([]);
  loadingPayments = signal(false);
  registeringWeek = signal(false);

  // ── Computed pagos ────────────────────────────────────────────────────────
  ingresoConfirmed = computed(() => this.payments().some(p => p.type === 'INGRESO' && p.status === 'CONFIRMED'));
  rodamientosConfirmed = computed(() => this.payments().filter(p => p.type === 'RODAMIENTO' && p.status === 'CONFIRMED').length);
  pendingPayments = computed(() => this.payments().filter(p => p.status === 'PENDING').length);
  pendingDocs = computed(() => this.driver()?.documents.filter(d => !d.isVerified).length ?? 0);
  totalPagado = computed(() => this.payments().filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + p.amount, 0));

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getDriver(id).subscribe({
      next: (d) => { this.driver.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  switchPagos() {
    this.tab.set('pagos');
    if (this.payments().length === 0) this.loadPayments();
  }

  loadPayments() {
    const id = this.driver()?.id;
    if (!id) return;
    this.loadingPayments.set(true);
    this.api.getDriverPaymentsByDriverId(id).subscribe({
      next: p => { this.payments.set(p); this.loadingPayments.set(false); },
      error: () => this.loadingPayments.set(false),
    });
  }

  initials() {
    const d = this.driver();
    if (!d) return '?';
    return (d.user.firstName[0] ?? '') + (d.user.lastName[0] ?? '');
  }

  statusLabel(s: string) {
    const map: Record<string, string> = {
      PENDING: 'Pendiente', APPROVED: 'Activo',
      SUSPENDED: 'Suspendido', REJECTED: 'Rechazado',
      SUSPENDED_PAYMENT: 'Bloqueado',
    };
    return map[s] ?? s;
  }

  statusPayLabel(s: string) {
    const m: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', REJECTED: 'Rechazado' };
    return m[s] ?? s;
  }

  docLabel(type: string) {
    const map: Record<string, string> = {
      cedula: 'Cédula de ciudadanía', licencia: 'Licencia de conducción',
      soat: 'SOAT', tecnomecanica: 'Tecnomecánica',
      tarjeta_propiedad: 'Tarjeta de propiedad', antecedentes: 'Antecedentes',
    };
    return map[type] ?? type;
  }

  isExpiringSoon(date?: string) {
    if (!date) return false;
    return new Date(date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  }

  weekLabel(weekStart: string) {
    const monday = new Date(weekStart);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
    return `${fmt(monday)} – ${fmt(sunday)}`;
  }

  setStatus(status: string) {
    const id = this.driver()!.id;
    this.api.updateDriverStatus(id, status).subscribe({
      next: () => {
        this.driver.update(d => d ? { ...d, status: status as Driver['status'] } : d);
        this.showToast('Estado actualizado', false);
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

  resetPassword() {
    if (this.newPassword.length < 6) return;
    this.savingPwd.set(true);
    this.api.resetDriverPassword(this.driver()!.id, this.newPassword).subscribe({
      next: () => {
        this.savingPwd.set(false); this.showPwdForm.set(false); this.newPassword = '';
        this.showToast('Contraseña actualizada', false);
      },
      error: () => { this.savingPwd.set(false); this.showToast('Error al actualizar contraseña', true); },
    });
  }

  registrarSemana() {
    const id = this.driver()?.id;
    if (!id) return;
    this.registeringWeek.set(true);
    this.api.createDriverRodamiento(id).subscribe({
      next: () => {
        this.registeringWeek.set(false);
        this.loadPayments();
        this.showToast('Semana registrada — $50.000 pendiente de pago', false);
      },
      error: () => { this.registeringWeek.set(false); this.showToast('Error registrando semana', true); },
    });
  }

  confirmPayment(id: string) {
    this.api.confirmDriverPayment(id).subscribe({
      next: () => { this.loadPayments(); this.showToast('Pago confirmado', false); },
      error: () => this.showToast('Error confirmando pago', true),
    });
  }

  rejectPayment(id: string) {
    if (!confirm('¿Rechazar este pago?')) return;
    this.api.rejectDriverPayment(id).subscribe({
      next: () => this.loadPayments(),
      error: () => this.showToast('Error rechazando pago', true),
    });
  }

  private showToast(msg: string, isError: boolean) {
    this.toast.set(msg); this.toastError.set(isError);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
