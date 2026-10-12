import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, DriverPayment } from '../../core/services/api.service';

interface Week { label: string; monday: Date; sunday: Date; }

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">PAGOS CONDUC<span>TORES</span></h1>
          <div class="cyan-divider"></div>
          <p class="page-subtitle">Nequi 3156560685 · Ingreso $150.000 · Rodamiento semanal $50.000</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-val yellow">{{ pendingCount() }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-val cyan">{{ ingresoConfirmed() }}</div>
          <div class="stat-label">Inscripciones confirmadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-val cyan">{{ rodamientoThisWeek() }}</div>
          <div class="stat-label">Rodamientos semana actual</div>
        </div>
        <div class="stat-card">
          <div class="stat-val green">\${{ totalConfirmed() | number:'1.0-0' }}</div>
          <div class="stat-label">Total confirmado</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="tab() === 'ingreso'" (click)="tab.set('ingreso')">
          <span class="tab-icon ingreso">💳</span>
          <span class="tab-info">
            <span class="tab-label">Inscripción</span>
            <span class="tab-desc">Pago único · $150.000</span>
          </span>
          @if (pendingIngreso() > 0) {
            <span class="tab-count">{{ pendingIngreso() }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="tab() === 'rodamiento'" (click)="tab.set('rodamiento')">
          <span class="tab-icon rodamiento">🔄</span>
          <span class="tab-info">
            <span class="tab-label">Control Semanal</span>
            <span class="tab-desc">Rodamiento · $50.000</span>
          </span>
          @if (pendingRodamiento() > 0) {
            <span class="tab-count">{{ pendingRodamiento() }}</span>
          }
        </button>
      </div>

      @if (error()) {
        <div class="error-box">{{ error() }}</div>
      }

      <!-- TAB INSCRIPCIÓN -->
      @if (tab() === 'ingreso') {
        <div class="filters">
          <div class="filter-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="filter-input" type="text" placeholder="Buscar conductora por nombre o teléfono…"
              [(ngModel)]="searchIngreso">
          </div>
          <select class="filter-select" [(ngModel)]="statusFilterIngreso">
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Conductora</th>
                <th>Monto</th>
                <th>Referencia Nequi</th>
                <th>Estado</th>
                <th>Fecha registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredIngreso(); track p.id) {
                <tr>
                  <td>
                    <div class="driver-cell">
                      <div class="driver-avatar">{{ initials(p) }}</div>
                      <div>
                        <div class="driver-name">{{ p.driver.user.firstName }} {{ p.driver.user.lastName }}</div>
                        <div class="driver-phone">{{ p.driver.user.phone }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="amount-cell">\${{ p.amount | number:'1.0-0' }}</span></td>
                  <td>
                    @if (p.referenceNumber) {
                      <span class="ref-value">{{ p.referenceNumber }}</span>
                    } @else {
                      <span class="ref-empty">Sin referencia</span>
                    }
                  </td>
                  <td><span class="status-pill {{ p.status.toLowerCase() }}"><span class="status-dot"></span>{{ statusLabel(p.status) }}</span></td>
                  <td><span class="date-cell">{{ p.createdAt | date:'dd/MM/yy HH:mm' }}</span></td>
                  <td>
                    @if (p.status === 'PENDING') {
                      <div class="actions-cell">
                        <button class="btn-confirm-sm" (click)="openModal(p)">✓ Confirmar</button>
                        <button class="btn-reject-sm" (click)="reject(p.id)">✕</button>
                      </div>
                    } @else if (p.status === 'CONFIRMED') {
                      <span class="confirmed-label">Confirmado ✓</span>
                    } @else {
                      <span class="rejected-label">Rechazado</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">No hay registros con este filtro.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB CONTROL SEMANAL -->
      @if (tab() === 'rodamiento') {
        <div class="filters">
          <div class="filter-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="filter-input" type="text" placeholder="Buscar conductora…"
              [(ngModel)]="searchRodamiento">
          </div>
          <select class="filter-select" [(ngModel)]="weekFilter">
            <option value="all">Todas las semanas {{ currentYear }}</option>
            @for (w of weeks; track w.label) {
              <option [value]="w.monday.toISOString()">{{ w.label }}</option>
            }
          </select>
          <select class="filter-select" [(ngModel)]="statusFilterRodamiento">
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Conductora</th>
                <th>Monto</th>
                <th>Referencia Nequi</th>
                <th>Semana</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredRodamiento(); track p.id) {
                <tr>
                  <td>
                    <div class="driver-cell">
                      <div class="driver-avatar">{{ initials(p) }}</div>
                      <div>
                        <div class="driver-name">{{ p.driver.user.firstName }} {{ p.driver.user.lastName }}</div>
                        <div class="driver-phone">{{ p.driver.user.phone }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="amount-cell">\${{ p.amount | number:'1.0-0' }}</span></td>
                  <td>
                    @if (p.referenceNumber) {
                      <span class="ref-value">{{ p.referenceNumber }}</span>
                    } @else {
                      <span class="ref-empty">Sin referencia</span>
                    }
                  </td>
                  <td>
                    @if (p.weekStart) {
                      <span class="week-cell">{{ weekRangeLabel(p.weekStart) }}</span>
                    }
                  </td>
                  <td><span class="status-pill {{ p.status.toLowerCase() }}"><span class="status-dot"></span>{{ statusLabel(p.status) }}</span></td>
                  <td><span class="date-cell">{{ p.createdAt | date:'dd/MM/yy' }}</span></td>
                  <td>
                    @if (p.status === 'PENDING') {
                      <div class="actions-cell">
                        <button class="btn-confirm-sm" (click)="openModal(p)">✓ Confirmar</button>
                        <button class="btn-reject-sm" (click)="reject(p.id)">✕</button>
                      </div>
                    } @else if (p.status === 'CONFIRMED') {
                      <span class="confirmed-label">Confirmado ✓</span>
                    } @else {
                      <span class="rejected-label">Rechazado</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-cell">No hay registros con este filtro.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Modal confirmar -->
    @if (modalPayment()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">CONFIRMAR PAGO</div>
          <div class="modal-sub">Verifica la referencia en tu app Nequi antes de confirmar</div>

          <div class="modal-driver">
            <div class="driver-avatar" style="width:38px;height:38px;font-size:13px">{{ initials(modalPayment()!) }}</div>
            <div>
              <div class="modal-driver-name">{{ modalPayment()!.driver.user.firstName }} {{ modalPayment()!.driver.user.lastName }}</div>
              <div class="modal-driver-sub">{{ modalPayment()!.driver.user.phone }} · {{ modalPayment()!.type === 'INGRESO' ? 'Inscripción' : 'Rodamiento' }}</div>
            </div>
            <div class="modal-amount">\${{ modalPayment()!.amount | number:'1.0-0' }}</div>
          </div>

          @if (modalPayment()!.referenceNumber) {
            <div class="modal-ref-box">
              <div class="modal-ref-label">Referencia reportada por la conductora</div>
              <div class="modal-ref-value">{{ modalPayment()!.referenceNumber }}</div>
              <div class="modal-ref-hint">Verifica que este número coincida en tu Nequi</div>
            </div>
          } @else {
            <div class="modal-ref-box no-ref">
              <div class="modal-ref-label">Sin referencia reportada</div>
              <div class="modal-ref-hint">La conductora no envió número de comprobante</div>
            </div>
          }

          <label class="modal-note-label">Nota interna (opcional)</label>
          <input class="modal-input" type="text" [(ngModel)]="modalNote" placeholder="Ej: Verificado Nequi 10:45am">

          <div class="modal-actions">
            <button class="modal-btn-confirm" (click)="confirmModal()" [disabled]="confirming()">
              {{ confirming() ? 'Confirmando…' : '✓ Confirmar pago' }}
            </button>
            <button class="modal-btn-cancel" (click)="closeModal()">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 32px; color: #e0e0e0; }

    .page-header { margin-bottom: 20px; }
    .page-title { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 6px; }
    .page-title span { color: #00d4e8; }
    .cyan-divider { height: 2px; width: 40px; background: #00d4e8; margin-bottom: 6px; }
    .page-subtitle { color: #555; font-size: 13px; }

    /* Stats */
    .stats-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px; padding: 14px 18px; flex: 1; min-width: 120px; }
    .stat-val { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 800; color: #fff; }
    .stat-val.cyan { color: #00d4e8; }
    .stat-val.yellow { color: #ffab00; }
    .stat-val.green { color: #00d464; }
    .stat-label { font-size: 11px; color: #444; margin-top: 4px; text-transform: uppercase; letter-spacing: .5px; }

    /* Tabs */
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab-btn {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 18px; border-radius: 10px;
      background: #0d0d0d; border: 1px solid #1a1a1a;
      color: #444; cursor: pointer; transition: all .2s;
      font-family: 'Inter', sans-serif;
    }
    .tab-btn.active { border-color: #00d4e8; color: #00d4e8; background: rgba(0,212,232,.05); }
    .tab-icon { font-size: 18px; }
    .tab-info { display: flex; flex-direction: column; align-items: flex-start; }
    .tab-label { font-size: 13px; font-weight: 700; line-height: 1; }
    .tab-desc { font-size: 11px; color: #444; margin-top: 2px; }
    .tab-btn.active .tab-desc { color: rgba(0,212,232,.5); }
    .tab-count { background: #ff4444; color: #fff; border-radius: 99px; font-size: 10px; font-weight: 700; padding: 2px 7px; margin-left: 4px; }

    .error-box { background: rgba(255,68,68,.1); border: 1px solid rgba(255,68,68,.3); border-radius: 8px; padding: 12px 16px; color: #ff6666; margin-bottom: 20px; font-size: 13px; }

    /* Filtros */
    .filters {
      background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 10px;
      padding: 12px 14px; margin-bottom: 14px;
      display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
    }
    .filter-search { flex: 1; min-width: 200px; position: relative; }
    .filter-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #444; }
    .filter-input {
      width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 8px;
      padding: 8px 12px 8px 32px; color: #ccc; font-size: 13px;
      font-family: 'Inter', sans-serif; outline: none; transition: border-color .2s;
    }
    .filter-input:focus { border-color: #00d4e8; }
    .filter-input::placeholder { color: #333; }
    .filter-select {
      background: #111; border: 1px solid #1e1e1e; border-radius: 8px;
      padding: 8px 12px; color: #888; font-size: 13px;
      font-family: 'Inter', sans-serif; outline: none; cursor: pointer;
    }
    .filter-select:focus { border-color: #00d4e8; }

    /* Tabla */
    .table-wrap { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 640px; }
    thead tr { background: #0a0a0a; border-bottom: 1px solid #1a1a1a; }
    th { padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #444; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
    tbody tr { border-bottom: 1px solid #0f0f0f; transition: background .1s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: rgba(255,255,255,.015); }
    td { padding: 13px 16px; font-size: 13px; vertical-align: middle; }

    .driver-cell { display: flex; align-items: center; gap: 10px; }
    .driver-avatar {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: rgba(0,212,232,.1); border: 1px solid rgba(0,212,232,.2);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; color: #00d4e8;
    }
    .driver-name { color: #fff; font-weight: 600; font-size: 13px; }
    .driver-phone { color: #555; font-size: 11px; margin-top: 1px; }

    .amount-cell { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; color: #00d4e8; }

    .ref-value { font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #a0e878; letter-spacing: .5px; }
    .ref-empty { color: #2a2a2a; font-size: 12px; font-style: italic; }

    .week-cell { color: #888; font-size: 12px; white-space: nowrap; }
    .date-cell { color: #444; font-size: 12px; white-space: nowrap; }

    .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .status-pill.pending { background: rgba(255,171,0,.1); color: #ffab00; border: 1px solid rgba(255,171,0,.2); }
    .status-pill.confirmed { background: rgba(0,212,100,.1); color: #00d464; border: 1px solid rgba(0,212,100,.2); }
    .status-pill.rejected { background: rgba(255,68,68,.1); color: #ff6666; border: 1px solid rgba(255,68,68,.2); }
    .status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .status-pill.pending .status-dot { background: #ffab00; }
    .status-pill.confirmed .status-dot { background: #00d464; }
    .status-pill.rejected .status-dot { background: #ff6666; }

    .actions-cell { display: flex; gap: 6px; }
    .btn-confirm-sm {
      padding: 5px 12px; border-radius: 6px; background: rgba(0,212,100,.1);
      border: 1px solid rgba(0,212,100,.25); color: #00d464; font-size: 11px;
      font-weight: 700; cursor: pointer; white-space: nowrap; font-family: 'Inter', sans-serif;
      &:hover { background: rgba(0,212,100,.2); }
    }
    .btn-reject-sm {
      padding: 5px 10px; border-radius: 6px; background: transparent;
      border: 1px solid #1e1e1e; color: #555; font-size: 11px;
      font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
      &:hover { border-color: #ff4444; color: #ff6666; }
    }
    .confirmed-label { font-size: 12px; color: #00d464; font-weight: 600; }
    .rejected-label { font-size: 12px; color: #555; }
    .empty-cell { text-align: center; color: #2a2a2a; padding: 48px; font-size: 14px; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.75);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal { background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 16px; padding: 28px; width: 420px; max-width: 95vw; }
    .modal-title { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; color: #fff; letter-spacing: 1px; margin-bottom: 4px; }
    .modal-sub { color: #444; font-size: 13px; margin-bottom: 20px; }
    .modal-driver {
      background: #111; border: 1px solid #1a1a1a; border-radius: 10px;
      padding: 12px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;
    }
    .modal-driver-name { color: #fff; font-weight: 600; font-size: 14px; }
    .modal-driver-sub { color: #555; font-size: 12px; margin-top: 2px; }
    .modal-amount { margin-left: auto; font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 800; color: #00d4e8; white-space: nowrap; }
    .modal-ref-box {
      background: rgba(160,232,120,.06); border: 1px solid rgba(160,232,120,.2);
      border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;
      &.no-ref { background: rgba(255,255,255,.03); border-color: #1e1e1e; }
    }
    .modal-ref-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .modal-ref-value { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; color: #a0e878; letter-spacing: 1px; }
    .modal-ref-hint { font-size: 11px; color: #444; margin-top: 4px; }
    .modal-note-label { font-size: 12px; color: #555; display: block; margin-bottom: 6px; }
    .modal-input {
      width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 8px;
      padding: 10px 12px; color: #ccc; font-size: 13px;
      font-family: 'Inter', sans-serif; outline: none; margin-bottom: 20px;
      &:focus { border-color: #00d4e8; }
    }
    .modal-actions { display: flex; gap: 10px; }
    .modal-btn-confirm {
      flex: 1; padding: 11px; border-radius: 8px;
      background: rgba(0,212,100,.12); border: 1px solid rgba(0,212,100,.3);
      color: #00d464; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: 'Inter', sans-serif;
      &:hover:not(:disabled) { background: rgba(0,212,100,.22); }
      &:disabled { opacity: .5; cursor: default; }
    }
    .modal-btn-cancel {
      padding: 11px 18px; border-radius: 8px; background: transparent;
      border: 1px solid #1e1e1e; color: #555; font-size: 13px;
      font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      &:hover { border-color: #333; color: #888; }
    }
  `],
})
export class PagosComponent implements OnInit {
  private api = inject(ApiService);

  tab = signal<'ingreso' | 'rodamiento'>('ingreso');
  all = signal<DriverPayment[]>([]);
  error = signal('');
  confirming = signal(false);
  modalPayment = signal<DriverPayment | null>(null);
  modalNote = '';

  searchIngreso = '';
  statusFilterIngreso = '';
  searchRodamiento = '';
  statusFilterRodamiento = '';
  weekFilter = '';

  currentYear = new Date().getFullYear();
  weeks: Week[] = [];

  // ── Computed ────────────────────────────────────────────────────────────

  ingreso = computed(() => this.all().filter(p => p.type === 'INGRESO'));
  rodamiento = computed(() => this.all().filter(p => p.type === 'RODAMIENTO'));

  pendingIngreso = computed(() => this.ingreso().filter(p => p.status === 'PENDING').length);
  pendingRodamiento = computed(() => this.rodamiento().filter(p => p.status === 'PENDING').length);
  pendingCount = computed(() => this.pendingIngreso() + this.pendingRodamiento());

  ingresoConfirmed = computed(() => this.ingreso().filter(p => p.status === 'CONFIRMED').length);
  rodamientoThisWeek = computed(() => {
    const monday = this.getWeekStart(new Date());
    return this.rodamiento().filter(p => {
      if (!p.weekStart) return false;
      const d = new Date(p.weekStart);
      return d.getTime() === monday.getTime() && p.status === 'CONFIRMED';
    }).length;
  });
  totalConfirmed = computed(() =>
    this.all().filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + p.amount, 0)
  );

  filteredIngreso = computed(() => {
    const search = this.searchIngreso.toLowerCase();
    return this.ingreso().filter(p => {
      const name = `${p.driver.user.firstName} ${p.driver.user.lastName}`.toLowerCase();
      const phone = p.driver.user.phone;
      const matchSearch = !search || name.includes(search) || phone.includes(search);
      const matchStatus = !this.statusFilterIngreso || p.status === this.statusFilterIngreso;
      return matchSearch && matchStatus;
    });
  });

  filteredRodamiento = computed(() => {
    const search = this.searchRodamiento.toLowerCase();
    return this.rodamiento().filter(p => {
      const name = `${p.driver.user.firstName} ${p.driver.user.lastName}`.toLowerCase();
      const phone = p.driver.user.phone;
      const matchSearch = !search || name.includes(search) || phone.includes(search);
      const matchStatus = !this.statusFilterRodamiento || p.status === this.statusFilterRodamiento;
      const matchWeek = this.weekFilter === 'all' || !this.weekFilter
        ? true
        : p.weekStart
          ? new Date(p.weekStart).getTime() === new Date(this.weekFilter).getTime()
          : false;
      return matchSearch && matchStatus && matchWeek;
    });
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────

  ngOnInit() {
    this.buildWeeks();
    this.weekFilter = this.weeks[0]?.monday.toISOString() ?? 'all';
    this.load();
  }

  load() {
    this.error.set('');
    this.api.getDriverPayments().subscribe({
      next: data => this.all.set(data),
      error: () => this.error.set('Error cargando pagos'),
    });
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  openModal(p: DriverPayment) {
    this.modalPayment.set(p);
    this.modalNote = '';
  }

  closeModal() {
    this.modalPayment.set(null);
    this.modalNote = '';
  }

  confirmModal() {
    const p = this.modalPayment();
    if (!p) return;
    this.confirming.set(true);
    this.api.confirmDriverPayment(p.id).subscribe({
      next: () => {
        this.confirming.set(false);
        this.closeModal();
        this.load();
      },
      error: () => {
        this.confirming.set(false);
        this.error.set('Error confirmando pago');
      },
    });
  }

  reject(id: string) {
    if (!confirm('¿Rechazar este pago?')) return;
    this.api.rejectDriverPayment(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Error rechazando pago'),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  initials(p: DriverPayment) {
    return (p.driver.user.firstName[0] ?? '') + (p.driver.user.lastName[0] ?? '');
  }

  statusLabel(s: string) {
    const m: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', REJECTED: 'Rechazado' };
    return m[s] ?? s;
  }

  weekRangeLabel(weekStart: string) {
    const monday = new Date(weekStart);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
    return `${fmt(monday)} – ${fmt(sunday)}`;
  }

  private buildWeeks() {
    const today = new Date();
    const year = today.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const dow = jan1.getDay();
    const firstMonday = new Date(jan1);
    firstMonday.setDate(jan1.getDate() + (dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow));

    const result: Week[] = [];
    const cur = new Date(firstMonday);
    let idx = 0;

    while (cur <= today) {
      const monday = new Date(cur);
      const sunday = new Date(cur);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
      const fmtFull = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const label = idx === 0
        ? `Semana actual (${fmt(monday)} – ${fmt(sunday)})`
        : idx === 1
        ? `Semana anterior (${fmt(monday)} – ${fmt(sunday)})`
        : `${fmtFull(monday)} – ${fmtFull(sunday)}`;
      result.push({ label, monday, sunday });
      cur.setDate(cur.getDate() + 7);
      idx++;
    }

    this.weeks = result.reverse();
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
