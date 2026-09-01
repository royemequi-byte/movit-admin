import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, Document } from '../../core/services/api.service';

interface ExpiringDoc extends Document {
  driver: { user: { firstName: string; lastName: string; phone: string } };
}

@Component({
  selector: 'app-expiring-docs',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-container">
      <div>
        <h1 class="page-title">VENCI<span>MIENTOS</span></h1>
        <div class="cyan-divider"></div>
        <p class="subtitle">Documentos que vencen en los próximos 30 días</p>
      </div>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (docs().length === 0) {
        <div class="mv-card mv-empty" style="border-color: rgba(0,230,118,.2);">
          <svg viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="2" style="width:32px;height:32px;margin-bottom:8px"><polyline points="20 6 9 17 4 12"/></svg>
          <div>Sin documentos próximos a vencer</div>
        </div>
      } @else {
        <div class="counter-row">
          <div class="counter urgent-counter">{{ urgentCount() }} <span>urgentes (< 7 días)</span></div>
          <div class="counter">{{ docs().length }} <span>total</span></div>
        </div>
        <div class="mv-card" style="padding: 0; overflow: hidden;">
          <table class="mv-table">
            <thead>
              <tr>
                <th>Conductor/a</th>
                <th>Teléfono</th>
                <th>Documento</th>
                <th>Vence</th>
                <th>Urgencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (d of docs(); track d.id) {
                <tr [class.urgent-row]="isUrgent(d.expiresAt)">
                  <td>{{ d.driver.user.firstName }} {{ d.driver.user.lastName }}</td>
                  <td>{{ d.driver.user.phone }}</td>
                  <td>{{ docTypeLabel(d.type) }}</td>
                  <td [class.urgent-date]="isUrgent(d.expiresAt)">
                    {{ d.expiresAt | date:'dd/MM/yyyy' }}
                  </td>
                  <td>
                    @if (isUrgent(d.expiresAt)) {
                      <span class="status-badge SUSPENDED">Urgente</span>
                    } @else {
                      <span class="status-badge PENDING">Pronto</span>
                    }
                  </td>
                  <td>
                    @if (d.fileUrl) {
                      <a [href]="d.fileUrl" target="_blank" class="btn-view">Ver doc</a>
                    }
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
    .subtitle { font-size: 13px; color: #666; margin-top: -12px; margin-bottom: 24px; }
    .counter-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .counter {
      padding: 10px 20px; background: #161616; border: 1px solid #252525; border-radius: 8px;
      font-family: 'Rajdhani', sans-serif; font-size: 28px; font-weight: 700; color: #fff;
      span { font-size: 12px; color: #666; margin-left: 6px; font-family: 'Roboto', sans-serif; font-weight: 400; }
    }
    .urgent-counter { border-color: rgba(255,68,68,.3); color: #ff4444; }
    .urgent-row td { background: rgba(255,68,68,.03); }
    .urgent-date { color: #ff4444; font-weight: 600; }
    .btn-view {
      padding: 5px 12px; border-radius: 6px;
      background: rgba(0,212,232,.08); color: #00d4e8;
      border: 1px solid rgba(0,212,232,.25);
      font-size: 12px; font-weight: 600; text-decoration: none;
      transition: background .2s;
      &:hover { background: rgba(0,212,232,.18); }
    }
  `],
})
export class ExpiringDocsComponent implements OnInit {
  private api = inject(ApiService);
  docs = signal<ExpiringDoc[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getExpiringDocuments(30).subscribe({
      next: (d) => { this.docs.set(d as ExpiringDoc[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isUrgent(date?: string) {
    if (!date) return false;
    return new Date(date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  }

  urgentCount() {
    return this.docs().filter(d => this.isUrgent(d.expiresAt)).length;
  }

  docTypeLabel(type: string) {
    const map: Record<string, string> = {
      SOAT: 'SOAT', LICENSE: 'Licencia', TECH_REVIEW: 'Revisión técnica',
      INSURANCE: 'Seguro', PROPERTY_CARD: 'Tarjeta de propiedad',
    };
    return map[type] ?? type;
  }
}
