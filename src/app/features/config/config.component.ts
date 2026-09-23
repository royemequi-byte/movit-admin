import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, AppConfig } from '../../core/services/api.service';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>Configuración de asignación</h1>
        <p class="sub">Controla cómo MOVIT-FUSA asigna conductoras a cada solicitud.</p>
      </div>

      @if (loading()) {
        <div class="loading">Cargando configuración…</div>
      } @else {
        <div class="cards">

          <div class="card">
            <div class="card-icon lila">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div class="card-body">
              <label>Radio inicial de búsqueda</label>
              <p class="desc">Distancia máxima a la que se buscan conductoras primero. Aumento en hora pico amplía la cobertura.</p>
              <div class="input-row">
                <input type="range" min="1" max="50" step="0.5"
                  [(ngModel)]="form.assignmentRadiusKm" (input)="dirty = true" />
                <div class="val-box">
                  <input type="number" min="1" max="50" step="0.5"
                    [(ngModel)]="form.assignmentRadiusKm" (change)="dirty = true" />
                  <span>km</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-icon cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="card-body">
              <label>Tiempo de respuesta por conductora</label>
              <p class="desc">Segundos que tiene cada conductora para aceptar antes de ofrecerle el viaje a la siguiente más cercana.</p>
              <div class="input-row">
                <input type="range" min="10" max="120" step="5"
                  [(ngModel)]="form.assignmentTimeoutSec" (input)="dirty = true" />
                <div class="val-box">
                  <input type="number" min="10" max="120" step="5"
                    [(ngModel)]="form.assignmentTimeoutSec" (change)="dirty = true" />
                  <span>s</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-icon warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="card-body">
              <label>Radio máximo de expansión</label>
              <p class="desc">Si ninguna conductora en el radio inicial responde, la búsqueda se expande hasta esta distancia.</p>
              <div class="input-row">
                <input type="range" min="1" max="100" step="1"
                  [(ngModel)]="form.maxSearchRadiusKm" (input)="dirty = true" />
                <div class="val-box">
                  <input type="number" min="1" max="100" step="1"
                    [(ngModel)]="form.maxSearchRadiusKm" (change)="dirty = true" />
                  <span>km</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="actions">
          @if (saved()) {
            <div class="saved-badge">✓ Guardado</div>
          }
          <button class="btn-save" [disabled]="!dirty || saving()" (click)="save()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 760px; }
    .header { margin-bottom: 32px; }
    h1 { font-family: 'Rajdhani', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 6px; }
    .sub { color: #666; font-size: 14px; margin: 0; }
    .loading { color: #666; padding: 40px 0; }

    .cards { display: flex; flex-direction: column; gap: 16px; }

    .card {
      background: #161616; border: 1px solid #252525;
      border-radius: 14px; padding: 24px;
      display: flex; gap: 20px; align-items: flex-start;
    }
    .card-icon {
      width: 44px; height: 44px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .card-icon.lila { background: rgba(206,162,253,.12); color: #cea2fd; }
    .card-icon.cyan { background: rgba(0,212,232,.1); color: #00d4e8; }
    .card-icon.warn { background: rgba(255,171,0,.1); color: #ffab00; }

    .card-body { flex: 1; }
    label { font-weight: 600; color: #fff; font-size: 15px; display: block; margin-bottom: 4px; }
    .desc { color: #666; font-size: 13px; line-height: 1.5; margin: 0 0 16px; }

    .input-row { display: flex; align-items: center; gap: 16px; }
    input[type=range] {
      flex: 1; accent-color: #cea2fd; height: 4px;
      cursor: pointer;
    }
    .val-box { display: flex; align-items: center; gap: 6px; }
    .val-box input[type=number] {
      width: 64px; background: #0d0d0d; border: 1px solid #333;
      border-radius: 8px; color: #fff; font-size: 15px; font-weight: 600;
      padding: 6px 10px; text-align: center;
    }
    .val-box span { color: #666; font-size: 13px; min-width: 16px; }

    .actions {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 16px; margin-top: 28px;
    }
    .saved-badge {
      color: #00e676; font-size: 14px; font-weight: 600;
    }
    .btn-save {
      background: linear-gradient(135deg, #8b5cf6, #cea2fd);
      border: none; border-radius: 10px; color: #fff;
      font-size: 14px; font-weight: 600; padding: 12px 28px;
      cursor: pointer; transition: opacity .2s;
      &:disabled { opacity: .5; cursor: not-allowed; }
      &:hover:not(:disabled) { opacity: .88; }
    }
  `],
})
export class ConfigComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  dirty = false;

  form = { assignmentRadiusKm: 5, assignmentTimeoutSec: 30, maxSearchRadiusKm: 20 };

  ngOnInit() {
    this.api.getAppConfig().subscribe({
      next: (cfg) => {
        this.form = {
          assignmentRadiusKm: cfg.assignmentRadiusKm,
          assignmentTimeoutSec: cfg.assignmentTimeoutSec,
          maxSearchRadiusKm: cfg.maxSearchRadiusKm,
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save() {
    this.saving.set(true);
    this.api.updateAppConfig(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.dirty = false;
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => this.saving.set(false),
    });
  }
}
