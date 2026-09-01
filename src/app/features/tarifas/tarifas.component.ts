import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, FareConfig, FareConfigInput } from '../../core/services/api.service';

interface FareForm {
  baseAmount: number;
  perKmAmount: number;
  perMinuteAmount: number;
  minimumAmount: number;
  nightMultiplier: number;
}

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-container">
      <div>
        <h1 class="page-title">TARI<span>FAS</span></h1>
        <div class="cyan-divider"></div>
        <p class="page-sub">Configura los precios que se cobran en cada viaje. Los cambios aplican de inmediato para nuevos viajes.</p>
      </div>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else {
        @if (successMsg()) {
          <div class="alert-success">{{ successMsg() }}</div>
        }
        @if (errorMsg()) {
          <div class="alert-error">{{ errorMsg() }}</div>
        }

        <div class="fare-grid">
          <!-- CAR -->
          <div class="fare-card">
            <div class="fare-header">
              <div class="fare-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="11" width="20" height="8" rx="2"/>
                  <path d="M5 11V8a7 7 0 0 1 14 0v3"/>
                  <circle cx="7" cy="18" r="1.5" fill="currentColor"/>
                  <circle cx="17" cy="18" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <div class="fare-title">Automóvil</div>
                <div class="fare-sub">Tarifas para vehículos de 4 ruedas</div>
              </div>
            </div>

            <div class="fields">
              <div class="field">
                <label>Tarifa base</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="car.baseAmount" name="car-base" />
                </div>
                <span class="hint">Cobro fijo al iniciar el viaje</span>
              </div>
              <div class="field">
                <label>Precio por km</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="car.perKmAmount" name="car-km" />
                </div>
                <span class="hint">Por cada kilómetro recorrido</span>
              </div>
              <div class="field">
                <label>Precio por minuto</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="car.perMinuteAmount" name="car-min" />
                </div>
                <span class="hint">Por cada minuto de viaje</span>
              </div>
              <div class="field">
                <label>Tarifa mínima</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="car.minimumAmount" name="car-minprice" />
                </div>
                <span class="hint">Cobro mínimo aunque sea distancia corta</span>
              </div>
              <div class="field">
                <label>Multiplicador nocturno</label>
                <div class="input-wrap">
                  <span class="prefix">×</span>
                  <input type="number" min="1" max="3" step="0.05" [(ngModel)]="car.nightMultiplier" name="car-night" />
                </div>
                <span class="hint">Se aplica entre 10 pm y 5 am (ej: 1.3 = 30% más)</span>
              </div>
            </div>

            <div class="preview-box">
              <span class="preview-label">Ejemplo viaje 5 km / 15 min:</span>
              <span class="preview-price">\${{ calcExample(car) }}</span>
            </div>

            <button class="btn-save" (click)="save('CAR')" [disabled]="saving() === 'CAR'">
              @if (saving() === 'CAR') {
                <span class="btn-spinner"></span> Guardando…
              } @else {
                Guardar automóvil
              }
            </button>
          </div>

          <!-- MOTORCYCLE -->
          <div class="fare-card">
            <div class="fare-header">
              <div class="fare-icon fare-icon-moto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <path d="M15 6h1l3 5H9l2-5h4z"/>
                  <path d="M9 11l-4 1"/>
                </svg>
              </div>
              <div>
                <div class="fare-title">Motocicleta</div>
                <div class="fare-sub">Tarifas para motos</div>
              </div>
            </div>

            <div class="fields">
              <div class="field">
                <label>Tarifa base</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="moto.baseAmount" name="moto-base" />
                </div>
                <span class="hint">Cobro fijo al iniciar el viaje</span>
              </div>
              <div class="field">
                <label>Precio por km</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="moto.perKmAmount" name="moto-km" />
                </div>
                <span class="hint">Por cada kilómetro recorrido</span>
              </div>
              <div class="field">
                <label>Precio por minuto</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="moto.perMinuteAmount" name="moto-min" />
                </div>
                <span class="hint">Por cada minuto de viaje</span>
              </div>
              <div class="field">
                <label>Tarifa mínima</label>
                <div class="input-wrap">
                  <span class="prefix">$</span>
                  <input type="number" min="0" [(ngModel)]="moto.minimumAmount" name="moto-minprice" />
                </div>
                <span class="hint">Cobro mínimo aunque sea distancia corta</span>
              </div>
              <div class="field">
                <label>Multiplicador nocturno</label>
                <div class="input-wrap">
                  <span class="prefix">×</span>
                  <input type="number" min="1" max="3" step="0.05" [(ngModel)]="moto.nightMultiplier" name="moto-night" />
                </div>
                <span class="hint">Se aplica entre 10 pm y 5 am (ej: 1.3 = 30% más)</span>
              </div>
            </div>

            <div class="preview-box">
              <span class="preview-label">Ejemplo viaje 5 km / 15 min:</span>
              <span class="preview-price">\${{ calcExample(moto) }}</span>
            </div>

            <button class="btn-save" (click)="save('MOTORCYCLE')" [disabled]="saving() === 'MOTORCYCLE'">
              @if (saving() === 'MOTORCYCLE') {
                <span class="btn-spinner"></span> Guardando…
              } @else {
                Guardar motocicleta
              }
            </button>
          </div>
        </div>

        <!-- Info box -->
        <div class="info-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>La tarifa final de un viaje es: <strong>max(base + km × precioKm + min × precioMin, mínima)</strong>. En horario nocturno se multiplica por el factor configurado.</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub {
      color: #666; font-size: 13px; margin-top: 8px; margin-bottom: 28px; max-width: 560px;
    }

    .fare-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .fare-card {
      background: #161616; border: 1px solid #252525; border-radius: 14px; padding: 24px;
      display: flex; flex-direction: column; gap: 0;
      transition: border-color .2s;
      &:hover { border-color: rgba(0,212,232,.2); }
    }

    .fare-header {
      display: flex; align-items: center; gap: 14px; margin-bottom: 24px;
    }

    .fare-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: rgba(0,212,232,.08); border: 1px solid rgba(0,212,232,.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      svg { width: 22px; height: 22px; color: #00d4e8; }
    }
    .fare-icon-moto {
      background: rgba(255,171,0,.08); border-color: rgba(255,171,0,.2);
      svg { color: #ffab00; }
    }

    .fare-title {
      font-family: 'Rajdhani', sans-serif; font-size: 18px; font-weight: 700; color: #fff;
    }
    .fare-sub { font-size: 12px; color: #555; margin-top: 2px; }

    .fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }

    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 12px; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }
    .hint { font-size: 11px; color: #444; }

    .input-wrap {
      display: flex; align-items: center;
      background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 8px;
      overflow: hidden;
      &:focus-within { border-color: rgba(0,212,232,.4); }
    }
    .prefix {
      padding: 0 10px; color: #555; font-size: 14px;
      border-right: 1px solid #2a2a2a; background: #111;
      height: 38px; display: flex; align-items: center;
    }
    .input-wrap input {
      flex: 1; padding: 0 12px; height: 38px;
      background: transparent; border: none; outline: none;
      color: #fff; font-size: 14px;
    }

    .preview-box {
      display: flex; align-items: center; justify-content: space-between;
      background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 20px;
    }
    .preview-label { font-size: 12px; color: #555; }
    .preview-price { font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700; color: #00d4e8; }

    .btn-save {
      width: 100%; padding: 11px; border-radius: 8px;
      background: rgba(0,212,232,.1); border: 1px solid rgba(0,212,232,.3);
      color: #00d4e8; font-size: 14px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .2s, border-color .2s;
      &:hover:not(:disabled) { background: rgba(0,212,232,.2); border-color: rgba(0,212,232,.5); }
      &:disabled { opacity: .5; cursor: default; }
    }

    .btn-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(0,212,232,.3); border-top-color: #00d4e8;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .alert-success {
      padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;
      background: rgba(0,230,118,.1); border: 1px solid rgba(0,230,118,.3);
      color: #00e676; font-size: 13px;
    }
    .alert-error {
      padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;
      background: rgba(255,68,68,.1); border: 1px solid rgba(255,68,68,.3);
      color: #ff4444; font-size: 13px;
    }

    .info-box {
      display: flex; align-items: flex-start; gap: 10px; margin-top: 24px;
      background: #111; border: 1px solid #222; border-radius: 8px;
      padding: 12px 16px; color: #555; font-size: 12px; line-height: 1.5;
      strong { color: #777; }
    }
  `],
})
export class TarifasComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  saving = signal<'CAR' | 'MOTORCYCLE' | null>(null);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  car: FareForm = { baseAmount: 3000, perKmAmount: 1500, perMinuteAmount: 100, minimumAmount: 5000, nightMultiplier: 1.3 };
  moto: FareForm = { baseAmount: 2000, perKmAmount: 1000, perMinuteAmount: 80, minimumAmount: 3500, nightMultiplier: 1.2 };

  ngOnInit() {
    this.api.getFareConfig().subscribe({
      next: (configs) => {
        for (const c of configs) {
          const form: FareForm = {
            baseAmount: c.baseAmount,
            perKmAmount: c.perKmAmount,
            perMinuteAmount: c.perMinuteAmount,
            minimumAmount: c.minimumAmount,
            nightMultiplier: c.nightMultiplier,
          };
          if (c.vehicleType === 'CAR') this.car = form;
          if (c.vehicleType === 'MOTORCYCLE') this.moto = form;
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  calcExample(f: FareForm): string {
    const km = 5, min = 15;
    const raw = f.baseAmount + km * f.perKmAmount + min * f.perMinuteAmount;
    const total = Math.max(raw, f.minimumAmount);
    return new Intl.NumberFormat('es-CO').format(Math.round(total));
  }

  save(vehicleType: 'CAR' | 'MOTORCYCLE') {
    const form = vehicleType === 'CAR' ? this.car : this.moto;
    const input: FareConfigInput = { vehicleType, ...form };
    this.saving.set(vehicleType);

    this.api.upsertFareConfig(input).subscribe({
      next: () => {
        this.saving.set(null);
        const label = vehicleType === 'CAR' ? 'Automóvil' : 'Motocicleta';
        this.successMsg.set(`✓ Tarifas de ${label} guardadas correctamente.`);
        setTimeout(() => this.successMsg.set(null), 4000);
      },
      error: () => {
        this.saving.set(null);
        this.errorMsg.set('Error al guardar. Verifica tu conexión e intenta de nuevo.');
        setTimeout(() => this.errorMsg.set(null), 5000);
      },
    });
  }
}
