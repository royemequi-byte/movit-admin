import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, DriverPayment } from '../../core/services/api.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>PAGOS CONDUCTORES</h1>
          <p class="subtitle">Ingreso ($150.000) y rodamiento semanal ($50.000) · Nequi 3156560685</p>
        </div>
        <div class="tabs">
          <button [class.active]="tab() === 'pending'" (click)="tab.set('pending'); load()">
            Pendientes
            @if (pending().length > 0) {
              <span class="badge-count">{{ pending().length }}</span>
            }
          </button>
          <button [class.active]="tab() === 'all'" (click)="tab.set('all'); load()">
            Todos
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="error-box">{{ error() }}</div>
      }

      <div class="payments-list">
        @for (p of list(); track p.id) {
          <div class="payment-card" [class.confirmed]="p.status === 'CONFIRMED'" [class.rejected]="p.status === 'REJECTED'">
            <div class="p-left">
              <div class="p-type" [class.ingreso]="p.type === 'INGRESO'" [class.rodamiento]="p.type === 'RODAMIENTO'">
                {{ p.type === 'INGRESO' ? 'INGRESO' : 'RODAMIENTO' }}
              </div>
              <div class="p-driver">
                <span class="p-name">{{ p.driver.user.firstName }} {{ p.driver.user.lastName }}</span>
                <span class="p-phone">{{ p.driver.user.phone }}</span>
              </div>
            </div>

            <div class="p-mid">
              <span class="p-amount">\${{ p.amount | number:'1.0-0' }}</span>
              @if (p.type === 'RODAMIENTO' && p.weekStart) {
                <span class="p-week">Semana del {{ p.weekStart | date:'dd/MM/yy' }}</span>
              }
              <span class="p-date">{{ p.createdAt | date:'dd/MM/yy HH:mm' }}</span>
            </div>

            <div class="p-right">
              <span class="status-badge" [class.pending]="p.status === 'PENDING'" [class.confirmed]="p.status === 'CONFIRMED'" [class.rejected]="p.status === 'REJECTED'">
                {{ p.status === 'PENDING' ? 'Pendiente' : p.status === 'CONFIRMED' ? 'Confirmado' : 'Rechazado' }}
              </span>

              @if (p.status === 'PENDING') {
                <div class="p-actions">
                  <button class="btn-confirm" (click)="confirm(p.id)">✓ Confirmar</button>
                  <button class="btn-reject" (click)="reject(p.id)">✕ Rechazar</button>
                </div>
              }
            </div>
          </div>
        } @empty {
          <div class="empty">
            {{ tab() === 'pending' ? 'No hay pagos pendientes.' : 'No hay pagos registrados.' }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; color: #e0e0e0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    h1 { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 2px; margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 13px; margin: 0; }

    .tabs { display: flex; gap: 8px; }
    .tabs button {
      background: #111; border: 1px solid #2a2a2a; color: #888;
      padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 13px;
      display: flex; align-items: center; gap: 8px;
      &.active { border-color: #00d4e8; color: #00d4e8; background: rgba(0,212,232,.06); }
    }
    .badge-count {
      background: #ff4444; color: #fff; border-radius: 99px;
      font-size: 11px; font-weight: 700; padding: 1px 7px; min-width: 20px; text-align: center;
    }

    .error-box { background: rgba(255,68,68,.1); border: 1px solid rgba(255,68,68,.3); border-radius: 8px; padding: 12px 16px; color: #ff6666; margin-bottom: 20px; font-size: 13px; }

    .payments-list { display: flex; flex-direction: column; gap: 10px; }

    .payment-card {
      background: #111; border: 1px solid #1e1e1e; border-radius: 12px;
      padding: 16px 20px;
      display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
      &.confirmed { border-color: rgba(0,212,100,.2); }
      &.rejected { opacity: .55; }
    }

    .p-left { display: flex; align-items: center; gap: 14px; min-width: 220px; }
    .p-type {
      font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 800;
      letter-spacing: 1px; padding: 5px 10px; border-radius: 6px; white-space: nowrap;
      &.ingreso { background: rgba(255,171,0,.12); color: #ffab00; border: 1px solid rgba(255,171,0,.3); }
      &.rodamiento { background: rgba(0,102,255,.12); color: #4d94ff; border: 1px solid rgba(0,102,255,.3); }
    }
    .p-driver { display: flex; flex-direction: column; gap: 2px; }
    .p-name { color: #fff; font-size: 14px; font-weight: 600; }
    .p-phone { color: #555; font-size: 12px; }

    .p-mid { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .p-amount { color: #00d4e8; font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; }
    .p-week, .p-date { color: #555; font-size: 12px; }

    .p-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .status-badge {
      font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 700;
      &.pending { background: rgba(255,171,0,.12); color: #ffab00; }
      &.confirmed { background: rgba(0,212,100,.12); color: #00d464; }
      &.rejected { background: rgba(255,68,68,.12); color: #ff6666; }
    }

    .p-actions { display: flex; gap: 8px; }
    .btn-confirm {
      background: rgba(0,212,100,.12); border: 1px solid rgba(0,212,100,.3);
      color: #00d464; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;
      &:hover { background: rgba(0,212,100,.2); }
    }
    .btn-reject {
      background: rgba(255,68,68,.08); border: 1px solid rgba(255,68,68,.25);
      color: #ff6666; padding: 7px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;
      &:hover { background: rgba(255,68,68,.15); }
    }

    .empty { color: #444; text-align: center; padding: 60px; font-size: 14px; }
  `],
})
export class PagosComponent implements OnInit {
  private api = inject(ApiService);

  tab = signal<'pending' | 'all'>('pending');
  pending = signal<DriverPayment[]>([]);
  list = signal<DriverPayment[]>([]);
  error = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.error.set('');
    if (this.tab() === 'pending') {
      this.api.getPendingDriverPayments().subscribe({
        next: data => { this.pending.set(data); this.list.set(data); },
        error: () => this.error.set('Error cargando pagos'),
      });
    } else {
      this.api.getDriverPayments().subscribe({
        next: data => {
          this.list.set(data);
          this.pending.set(data.filter(p => p.status === 'PENDING'));
        },
        error: () => this.error.set('Error cargando pagos'),
      });
    }
  }

  confirm(id: string) {
    this.api.confirmDriverPayment(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Error confirmando pago'),
    });
  }

  reject(id: string) {
    if (!confirm('¿Rechazar este pago?')) return;
    this.api.rejectDriverPayment(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Error rechazando pago'),
    });
  }
}
