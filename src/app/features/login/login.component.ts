import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-bg">
      <div class="login-card">
        <div class="logo-ring">
          <span>M</span>
        </div>
        <h1 class="brand">MOVIT<span>-FUSA</span></h1>
        <p class="slogan">TU VIAJE, NUESTRA PRIORIDAD</p>
        <div class="divider"></div>

        @if (!otpSent()) {
          <div class="field">
            <label>Teléfono</label>
            <input class="mv-input" [(ngModel)]="phone" type="tel"
              placeholder="+573001234567" (keyup.enter)="sendOtp()">
          </div>
          <button class="btn-cyan" (click)="sendOtp()" [disabled]="loading()">
            {{ loading() ? 'ENVIANDO...' : 'ENVIAR CÓDIGO' }}
          </button>
        } @else {
          <p class="hint">Código enviado a <strong>{{ phone }}</strong></p>
          <div class="field">
            <label>Código OTP</label>
            <input class="mv-input otp-input" [(ngModel)]="otp" type="text"
              maxlength="6" placeholder="000000" (keyup.enter)="verifyOtp()">
          </div>
          <button class="btn-cyan" (click)="verifyOtp()" [disabled]="loading()">
            {{ loading() ? 'VERIFICANDO...' : 'INGRESAR' }}
          </button>
          <button class="btn-back" (click)="otpSent.set(false)">← Cambiar número</button>
        }

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }

        <p class="footer-text">Panel exclusivo para administradores</p>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&display=swap');

    .login-bg {
      min-height: 100vh;
      background: radial-gradient(ellipse at center, #0f1a1f 0%, #0d0d0d 70%);
      display: flex; align-items: center; justify-content: center;
    }

    .login-card {
      width: 380px;
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 16px;
      padding: 40px 36px;
      text-align: center;
      box-shadow: 0 0 60px rgba(0,0,0,.6), 0 0 30px rgba(0,212,232,.05);
    }

    .logo-ring {
      width: 72px; height: 72px; border-radius: 50%;
      border: 2px solid #00d4e8;
      box-shadow: 0 0 20px rgba(0,212,232,.4), inset 0 0 20px rgba(0,212,232,.05);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      span {
        font-family: 'Rajdhani', sans-serif;
        font-size: 32px; font-weight: 700; color: #00d4e8;
      }
    }

    .brand {
      font-family: 'Rajdhani', sans-serif;
      font-size: 28px; font-weight: 700;
      color: #fff; letter-spacing: 2px;
      span { color: #00d4e8; }
    }

    .slogan {
      font-size: 10px; letter-spacing: 3px;
      color: #555; margin-top: 4px; text-transform: uppercase;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #00d4e8, transparent);
      margin: 24px 0;
    }

    .field {
      text-align: left; margin-bottom: 16px;
      label { display: block; font-size: 11px; letter-spacing: 1px; color: #888; margin-bottom: 6px; text-transform: uppercase; }
    }

    .mv-input {
      width: 100%; padding: 12px 16px;
      background: #0d0d0d; color: #fff;
      border: 1px solid #252525; border-radius: 8px;
      font-size: 15px; outline: none;
      transition: border-color .2s, box-shadow .2s;
      &::placeholder { color: #444; }
      &:focus { border-color: #00d4e8; box-shadow: 0 0 0 3px rgba(0,212,232,.1); }
    }

    .otp-input { text-align: center; font-size: 22px; letter-spacing: 8px; }

    .btn-cyan {
      width: 100%; padding: 13px;
      background: #00d4e8; color: #000;
      border: none; border-radius: 8px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 15px; font-weight: 700; letter-spacing: 1px;
      cursor: pointer; text-transform: uppercase;
      transition: box-shadow .2s, transform .1s;
      margin-top: 8px;
      &:hover:not(:disabled) { box-shadow: 0 0 20px rgba(0,212,232,.5); transform: translateY(-1px); }
      &:disabled { opacity: .4; cursor: not-allowed; }
    }

    .btn-back {
      background: none; border: none; color: #666;
      font-size: 13px; cursor: pointer; margin-top: 12px;
      &:hover { color: #00d4e8; }
    }

    .hint { font-size: 13px; color: #666; margin-bottom: 16px; strong { color: #ccc; } }

    .error-msg {
      margin-top: 14px; padding: 10px 14px;
      background: rgba(255,68,68,.1); border: 1px solid rgba(255,68,68,.3);
      border-radius: 8px; color: #ff4444; font-size: 13px;
    }

    .footer-text { margin-top: 24px; font-size: 11px; color: #333; }
  `],
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  phone = '';
  otp = '';
  otpSent = signal(false);
  loading = signal(false);
  error = signal('');

  sendOtp() {
    this.error.set('');
    this.loading.set(true);
    this.api.sendOtp(this.phone).subscribe({
      next: () => { this.otpSent.set(true); this.loading.set(false); },
      error: (e) => { this.error.set(e.error?.message ?? 'Error enviando código'); this.loading.set(false); },
    });
  }

  verifyOtp() {
    this.error.set('');
    this.loading.set(true);
    this.api.verifyOtp(this.phone, this.otp).subscribe({
      next: (res) => {
        if (res.user.role !== 'ADMIN') {
          this.error.set('No tienes permisos de administrador');
          this.loading.set(false);
          return;
        }
        localStorage.setItem('token', res.accessToken);
        this.router.navigate(['/drivers']);
      },
      error: (e) => { this.error.set(e.error?.message ?? 'Código inválido'); this.loading.set(false); },
    });
  }
}
