import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Ad } from '../../core/services/api.service';

@Component({
  selector: 'app-publicidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>PUBLICIDAD</h1>
          <p class="subtitle">Anuncios de comerciantes locales visibles en la app</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancelar' : '+ Nuevo anuncio' }}
        </button>
      </div>

      @if (showForm) {
        <div class="card form-card">
          <h3>{{ editingId ? 'Editar anuncio' : 'Nuevo anuncio' }}</h3>
          <div class="form-grid">
            <div class="field">
              <label>Nombre del comerciante *</label>
              <input [(ngModel)]="form.title" placeholder="Ej: Restaurante El Buen Sabor" />
            </div>
            <div class="field">
              <label>Texto del anuncio</label>
              <input [(ngModel)]="form.description" placeholder="Ej: 10% de descuento con ADVANCE 24" />
            </div>
            <div class="field">
              <label>URL de imagen (opcional)</label>
              <input [(ngModel)]="form.imageUrl" placeholder="https://..." />
            </div>
            <div class="field">
              <label>Enlace al tocar (WhatsApp, web)</label>
              <input [(ngModel)]="form.linkUrl" placeholder="https://wa.me/573001234567" />
            </div>
            <div class="field">
              <label>Fecha inicio (opcional)</label>
              <input type="date" [(ngModel)]="form.startsAt" />
            </div>
            <div class="field">
              <label>Fecha fin (opcional)</label>
              <input type="date" [(ngModel)]="form.endsAt" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" (click)="save()" [disabled]="!form.title">
              {{ editingId ? 'Guardar cambios' : 'Crear anuncio' }}
            </button>
          </div>
        </div>
      }

      @if (error()) {
        <div class="error-box">{{ error() }}</div>
      }

      <div class="ads-grid">
        @for (ad of ads(); track ad.id) {
          <div class="ad-card" [class.inactive]="!ad.isActive">
            @if (ad.imageUrl) {
              <img class="ad-img" [src]="ad.imageUrl" [alt]="ad.title" />
            } @else {
              <div class="ad-img-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            }
            <div class="ad-body">
              <div class="ad-header">
                <span class="ad-title">{{ ad.title }}</span>
                <span class="badge" [class.active]="ad.isActive" [class.off]="!ad.isActive">
                  {{ ad.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              @if (ad.description) {
                <p class="ad-desc">{{ ad.description }}</p>
              }
              @if (ad.linkUrl) {
                <p class="ad-link">🔗 {{ ad.linkUrl }}</p>
              }
              @if (ad.startsAt || ad.endsAt) {
                <p class="ad-dates">
                  {{ ad.startsAt ? (ad.startsAt | date:'dd/MM/yy') : '∞' }}
                  → {{ ad.endsAt ? (ad.endsAt | date:'dd/MM/yy') : '∞' }}
                </p>
              }
              <div class="ad-actions">
                <button class="btn-sm" (click)="toggleActive(ad)">
                  {{ ad.isActive ? 'Pausar' : 'Activar' }}
                </button>
                <button class="btn-sm" (click)="edit(ad)">Editar</button>
                <button class="btn-sm danger" (click)="remove(ad.id)">Eliminar</button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty">No hay anuncios creados aún.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; color: #e0e0e0; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    h1 { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 2px; margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 13px; margin: 0; }

    .btn-primary {
      background: linear-gradient(135deg, #003080, #0066ff);
      color: #fff; border: none; padding: 10px 20px;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
      &:disabled { opacity: .5; cursor: default; }
    }

    .card { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .form-card h3 { color: #00d4e8; margin: 0 0 20px; font-size: 15px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .field input {
      background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 8px;
      padding: 10px 14px; color: #e0e0e0; font-size: 14px;
      &:focus { outline: none; border-color: #00d4e8; }
    }
    .form-actions { margin-top: 20px; display: flex; justify-content: flex-end; }

    .error-box { background: rgba(255,68,68,.1); border: 1px solid rgba(255,68,68,.3); border-radius: 8px; padding: 12px 16px; color: #ff6666; margin-bottom: 20px; font-size: 13px; }

    .ads-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .ad-card {
      background: #111; border: 1px solid #1e1e1e; border-radius: 12px; overflow: hidden;
      &.inactive { opacity: .5; }
    }
    .ad-img { width: 100%; height: 140px; object-fit: cover; }
    .ad-img-placeholder {
      width: 100%; height: 140px; background: #1a1a1a;
      display: flex; align-items: center; justify-content: center;
      svg { width: 40px; height: 40px; color: #333; }
    }
    .ad-body { padding: 16px; }
    .ad-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ad-title { font-weight: 700; color: #fff; font-size: 14px; }
    .badge { font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 600;
      &.active { background: rgba(0,212,100,.15); color: #00d464; }
      &.off { background: rgba(255,68,68,.1); color: #ff6666; }
    }
    .ad-desc { color: #999; font-size: 13px; margin: 0 0 6px; }
    .ad-link { color: #00d4e8; font-size: 12px; margin: 0 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ad-dates { color: #555; font-size: 12px; margin: 0 0 12px; }
    .ad-actions { display: flex; gap: 8px; }
    .btn-sm {
      background: #1a1a1a; border: 1px solid #2a2a2a; color: #aaa;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
      &:hover { border-color: #00d4e8; color: #00d4e8; }
      &.danger:hover { border-color: #ff4444; color: #ff4444; }
    }

    .empty { color: #444; text-align: center; padding: 60px; font-size: 14px; }
  `],
})
export class PublicidadComponent implements OnInit {
  private api = inject(ApiService);

  ads = signal<Ad[]>([]);
  error = signal('');
  showForm = false;
  editingId: string | null = null;

  form: Partial<Ad> = { title: '', description: '', imageUrl: '', linkUrl: '', startsAt: '', endsAt: '' };

  ngOnInit() { this.load(); }

  load() {
    this.api.getAds().subscribe({
      next: ads => this.ads.set(ads),
      error: () => this.error.set('Error cargando anuncios'),
    });
  }

  save() {
    const payload = {
      title: this.form.title,
      description: this.form.description || undefined,
      imageUrl: this.form.imageUrl || undefined,
      linkUrl: this.form.linkUrl || undefined,
      startsAt: this.form.startsAt || undefined,
      endsAt: this.form.endsAt || undefined,
    };

    const req = this.editingId
      ? this.api.updateAd(this.editingId, payload)
      : this.api.createAd(payload);

    req.subscribe({
      next: () => { this.load(); this.resetForm(); },
      error: () => this.error.set('Error guardando anuncio'),
    });
  }

  edit(ad: Ad) {
    this.editingId = ad.id;
    this.form = {
      title: ad.title,
      description: ad.description ?? '',
      imageUrl: ad.imageUrl ?? '',
      linkUrl: ad.linkUrl ?? '',
      startsAt: ad.startsAt ? ad.startsAt.substring(0, 10) : '',
      endsAt: ad.endsAt ? ad.endsAt.substring(0, 10) : '',
    };
    this.showForm = true;
  }

  toggleActive(ad: Ad) {
    this.api.updateAd(ad.id, { isActive: !ad.isActive }).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Error actualizando anuncio'),
    });
  }

  remove(id: string) {
    if (!confirm('¿Eliminar este anuncio?')) return;
    this.api.deleteAd(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Error eliminando anuncio'),
    });
  }

  resetForm() {
    this.editingId = null;
    this.showForm = false;
    this.form = { title: '', description: '', imageUrl: '', linkUrl: '', startsAt: '', endsAt: '' };
  }
}
