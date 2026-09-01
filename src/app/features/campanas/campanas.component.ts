import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Campaign } from '../../core/services/api.service';

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

@Component({
  selector: 'app-campanas',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-container">
      <div>
        <h1 class="page-title">CAMPA<span>ÑAS</span></h1>
        <div class="cyan-divider"></div>
        <p class="sub">Crea descuentos automáticos que aplican cuando se cumplen las condiciones (horario, día, monto del viaje).</p>
      </div>

      @if (successMsg()) { <div class="alert-success">{{ successMsg() }}</div> }
      @if (errorMsg())   { <div class="alert-error">{{ errorMsg() }}</div> }

      <!-- Form -->
      <div class="form-card">
        <h3 class="form-title">{{ editingId() ? 'Editar campaña' : 'Nueva campaña' }}</h3>

        <div class="form-grid">
          <div class="field full">
            <label>Nombre de la campaña</label>
            <input class="mv-input" [(ngModel)]="form.name" placeholder="Ej: Miércoles de descuento" />
          </div>

          <div class="field">
            <label>Tipo de descuento</label>
            <select class="mv-input" [(ngModel)]="form.discountType">
              <option value="PERCENT">Porcentaje (%)</option>
              <option value="FIXED">Valor fijo ($)</option>
            </select>
          </div>

          <div class="field">
            <label>{{ form.discountType === 'PERCENT' ? 'Descuento (%)' : 'Descuento ($)' }}</label>
            <div class="prefix-wrap">
              <span class="pfx">{{ form.discountType === 'PERCENT' ? '%' : '$' }}</span>
              <input class="mv-input" type="number" [(ngModel)]="form.discountValue" min="1" />
            </div>
          </div>

          <div class="field">
            <label>Aplica solo si tarifa es ≤ (opcional)</label>
            <div class="prefix-wrap">
              <span class="pfx">$</span>
              <input class="mv-input" type="number" [(ngModel)]="form.maxFareAmount" placeholder="Sin límite" />
            </div>
            <span class="hint">Para recorridos cortos: ej $15.000</span>
          </div>

          <div class="field full">
            <label>Días activos (vacío = todos los días)</label>
            <div class="days-row">
              @for (d of dias; track $index) {
                <button type="button" class="day-btn" [class.active]="form.daysOfWeek.includes($index)" (click)="toggleDay($index)">
                  {{ d }}
                </button>
              }
            </div>
          </div>

          <div class="field">
            <label>Hora inicio (opcional)</label>
            <input class="mv-input" type="number" [(ngModel)]="form.startHour" placeholder="0-23" min="0" max="23" />
          </div>
          <div class="field">
            <label>Hora fin (opcional)</label>
            <input class="mv-input" type="number" [(ngModel)]="form.endHour" placeholder="0-23" min="0" max="23" />
            <span class="hint">Ej: inicio=6, fin=9 → aplica de 6am a 9am</span>
          </div>

          <div class="field">
            <label>Fecha inicio (opcional)</label>
            <input class="mv-input" type="date" [(ngModel)]="form.startsAt" />
          </div>
          <div class="field">
            <label>Fecha fin (opcional)</label>
            <input class="mv-input" type="date" [(ngModel)]="form.endsAt" />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-create" (click)="submit()" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : (editingId() ? 'Actualizar' : 'Crear campaña') }}
          </button>
          @if (editingId()) {
            <button class="btn-cancel" (click)="resetForm()">Cancelar</button>
          }
        </div>
      </div>

      <!-- List -->
      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else if (campanas().length === 0) {
        <div class="mv-card mv-empty">No hay campañas creadas aún.</div>
      } @else {
        <div class="cards-list">
          @for (c of campanas(); track c.id) {
            <div class="camp-card" [class.inactive]="!c.isActive">
              <div class="camp-header">
                <div>
                  <div class="camp-name">{{ c.name }}</div>
                  <div class="camp-meta">
                    <span class="badge-discount">
                      {{ c.discountType === 'PERCENT' ? '-' + c.discountValue + '%' : '-$' + fmt(c.discountValue) }}
                    </span>
                    @if (c.maxFareAmount) {
                      <span class="badge-cond">viajes ≤ {{ fmt(c.maxFareAmount) }}</span>
                    }
                    @if (c.daysOfWeek.length > 0) {
                      <span class="badge-cond">{{ diasLabel(c.daysOfWeek) }}</span>
                    }
                    @if (c.startHour !== null && c.endHour !== null) {
                      <span class="badge-cond">{{ c.startHour }}h–{{ c.endHour }}h</span>
                    }
                  </div>
                </div>
                <div class="camp-actions">
                  <button class="toggle-btn" [class.on]="c.isActive" (click)="toggleActive(c)">
                    {{ c.isActive ? 'Activa' : 'Pausada' }}
                  </button>
                  <button class="btn-edit-sm" (click)="startEdit(c)">Editar</button>
                  <button class="btn-del-sm" (click)="deleteC(c.id)">Eliminar</button>
                </div>
              </div>
              @if (c.startsAt || c.endsAt) {
                <div class="camp-dates">
                  {{ c.startsAt ? 'Desde ' + fmtDate(c.startsAt) : '' }}
                  {{ c.endsAt ? ' hasta ' + fmtDate(c.endsAt) : '' }}
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sub { color:#666; font-size:13px; margin-top:8px; margin-bottom:24px; }

    .form-card { background:#161616; border:1px solid #252525; border-radius:14px; padding:24px; margin-bottom:24px; }
    .form-title { font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:18px; }

    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    .field { display:flex; flex-direction:column; gap:5px; }
    .field.full { grid-column:1/-1; }
    .field label { font-size:11px; color:#888; font-weight:500; text-transform:uppercase; letter-spacing:.5px; }
    .hint { font-size:11px; color:#444; }

    .prefix-wrap { display:flex; align-items:center; border:1px solid #2a2a2a; border-radius:8px; overflow:hidden; &:focus-within{border-color:rgba(0,212,232,.4);} }
    .pfx { padding:0 10px; background:#111; color:#555; font-size:14px; height:38px; display:flex; align-items:center; border-right:1px solid #2a2a2a; }
    .prefix-wrap .mv-input { border:none; border-radius:0; flex:1; }

    .days-row { display:flex; gap:6px; flex-wrap:wrap; }
    .day-btn { padding:6px 12px; border-radius:20px; border:1px solid #2a2a2a; background:transparent; color:#666; font-size:13px; cursor:pointer; transition:.15s; &:hover{border-color:#444;color:#ccc;} &.active{background:rgba(0,212,232,.1);border-color:rgba(0,212,232,.4);color:#00d4e8;} }

    .form-actions { display:flex; gap:10px; }
    .btn-create { padding:10px 24px; background:rgba(0,212,232,.1); border:1px solid rgba(0,212,232,.3); color:#00d4e8; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; &:hover:not(:disabled){background:rgba(0,212,232,.2);} &:disabled{opacity:.5;cursor:default;} }
    .btn-cancel { padding:10px 20px; background:transparent; border:1px solid #333; color:#666; border-radius:8px; font-size:14px; cursor:pointer; }

    .cards-list { display:flex; flex-direction:column; gap:12px; }
    .camp-card { background:#161616; border:1px solid #252525; border-radius:12px; padding:18px 20px; transition:border-color .2s; &:hover{border-color:rgba(0,212,232,.15);} &.inactive{opacity:.55;} }
    .camp-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
    .camp-name { font-size:15px; font-weight:600; color:#fff; margin-bottom:8px; }
    .camp-meta { display:flex; gap:6px; flex-wrap:wrap; }
    .camp-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
    .camp-dates { font-size:11px; color:#555; margin-top:8px; }

    .badge-discount { background:rgba(0,230,118,.1); border:1px solid rgba(0,230,118,.3); color:#00e676; border-radius:20px; padding:3px 10px; font-size:12px; font-weight:700; }
    .badge-cond { background:#1a1a1a; border:1px solid #2a2a2a; color:#888; border-radius:20px; padding:3px 10px; font-size:11px; }

    .toggle-btn { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #333; background:transparent; color:#555; &.on{background:rgba(0,230,118,.1);border-color:rgba(0,230,118,.3);color:#00e676;} }
    .btn-edit-sm { padding:4px 10px; background:rgba(0,212,232,.08); border:1px solid rgba(0,212,232,.2); color:#00d4e8; border-radius:6px; font-size:12px; cursor:pointer; }
    .btn-del-sm  { padding:4px 10px; background:rgba(255,68,68,.08); border:1px solid rgba(255,68,68,.2); color:#ff4444; border-radius:6px; font-size:12px; cursor:pointer; }

    .alert-success { padding:12px 16px; border-radius:8px; margin-bottom:16px; background:rgba(0,230,118,.1); border:1px solid rgba(0,230,118,.3); color:#00e676; font-size:13px; }
    .alert-error   { padding:12px 16px; border-radius:8px; margin-bottom:16px; background:rgba(255,68,68,.1); border:1px solid rgba(255,68,68,.3); color:#ff4444; font-size:13px; }
  `],
})
export class CampanasComponent implements OnInit {
  private api = inject(ApiService);
  dias = DIAS;

  loading = signal(true);
  saving = signal(false);
  successMsg = signal<string|null>(null);
  errorMsg = signal<string|null>(null);
  campanas = signal<Campaign[]>([]);
  editingId = signal<string|null>(null);

  form = this.blankForm();

  blankForm() {
    return { name: '', discountType: 'PERCENT' as 'PERCENT'|'FIXED', discountValue: 20, maxFareAmount: null as number|null, daysOfWeek: [] as number[], startHour: null as number|null, endHour: null as number|null, startsAt: '', endsAt: '' };
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getCampaigns().subscribe({
      next: c => { this.campanas.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleDay(d: number) {
    this.form.daysOfWeek = this.form.daysOfWeek.includes(d)
      ? this.form.daysOfWeek.filter(x => x !== d)
      : [...this.form.daysOfWeek, d].sort();
  }

  submit() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    const payload = {
      name: this.form.name,
      discountType: this.form.discountType,
      discountValue: this.form.discountValue,
      maxFareAmount: this.form.maxFareAmount ?? undefined,
      daysOfWeek: this.form.daysOfWeek,
      startHour: this.form.startHour ?? undefined,
      endHour: this.form.endHour ?? undefined,
      startsAt: this.form.startsAt || undefined,
      endsAt: this.form.endsAt || undefined,
    };

    const req = this.editingId()
      ? this.api.updateCampaign(this.editingId()!, payload)
      : this.api.createCampaign(payload);

    req.subscribe({
      next: (c: Campaign) => {
        if (this.editingId()) {
          this.campanas.update(arr => arr.map(x => x.id === c.id ? c : x));
          this.flash('success', 'Campaña actualizada.');
        } else {
          this.campanas.update(arr => [c, ...arr]);
          this.flash('success', 'Campaña creada.');
        }
        this.resetForm();
        this.saving.set(false);
      },
      error: () => { this.saving.set(false); this.flash('error', 'Error al guardar.'); },
    });
  }

  startEdit(c: Campaign) {
    this.editingId.set(c.id);
    this.form = {
      name: c.name,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxFareAmount: c.maxFareAmount ?? null,
      daysOfWeek: [...c.daysOfWeek],
      startHour: c.startHour ?? null,
      endHour: c.endHour ?? null,
      startsAt: c.startsAt ? c.startsAt.slice(0,10) : '',
      endsAt: c.endsAt ? c.endsAt.slice(0,10) : '',
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() { this.editingId.set(null); this.form = this.blankForm(); }

  toggleActive(c: Campaign) {
    this.api.updateCampaign(c.id, { isActive: !c.isActive }).subscribe({
      next: updated => this.campanas.update(arr => arr.map(x => x.id === c.id ? { ...x, ...updated } : x)),
      error: () => this.flash('error', 'Error al cambiar estado.'),
    });
  }

  deleteC(id: string) {
    if (!confirm('¿Eliminar esta campaña?')) return;
    this.api.deleteCampaign(id).subscribe({
      next: () => { this.campanas.update(arr => arr.filter(c => c.id !== id)); this.flash('success', 'Campaña eliminada.'); },
      error: () => this.flash('error', 'Error al eliminar.'),
    });
  }

  diasLabel(dows: number[]) { return dows.map(d => this.dias[d]).join(', '); }
  fmt(v: number) { return '$' + new Intl.NumberFormat('es-CO').format(v); }
  fmtDate(d: string) { return new Date(d).toLocaleDateString('es-CO'); }

  private flash(type: 'success'|'error', msg: string) {
    if (type === 'success') { this.successMsg.set(msg); setTimeout(() => this.successMsg.set(null), 3000); }
    else { this.errorMsg.set(msg); setTimeout(() => this.errorMsg.set(null), 4000); }
  }
}
