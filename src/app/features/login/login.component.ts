import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="login-wrap">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>MOVIT-FUSA Admin</mat-card-title>
          <mat-card-subtitle>Panel de administración</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (!otpSent()) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Teléfono (+57...)</mat-label>
              <input matInput [(ngModel)]="phone" type="tel" placeholder="+573001234567">
            </mat-form-field>
            <button mat-raised-button color="primary" class="full-width" (click)="sendOtp()" [disabled]="loading()">
              {{ loading() ? 'Enviando...' : 'Enviar código' }}
            </button>
          } @else {
            <p class="otp-hint">Código enviado a {{ phone }}</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Código OTP</mat-label>
              <input matInput [(ngModel)]="otp" type="text" maxlength="6">
            </mat-form-field>
            <button mat-raised-button color="primary" class="full-width" (click)="verifyOtp()" [disabled]="loading()">
              {{ loading() ? 'Verificando...' : 'Ingresar' }}
            </button>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrap { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .login-card { width: 360px; padding: 16px; }
    .full-width { width: 100%; margin-top: 12px; }
    mat-card-header { margin-bottom: 16px; }
    .otp-hint { color: #666; margin-bottom: 8px; font-size: 14px; }
  `],
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  phone = '';
  otp = '';
  otpSent = signal(false);
  loading = signal(false);

  sendOtp() {
    this.loading.set(true);
    this.api.sendOtp(this.phone).subscribe({
      next: () => { this.otpSent.set(true); this.loading.set(false); },
      error: (e) => { this.snack.open(e.error?.message ?? 'Error enviando código', 'OK', { duration: 3000 }); this.loading.set(false); },
    });
  }

  verifyOtp() {
    this.loading.set(true);
    this.api.verifyOtp(this.phone, this.otp).subscribe({
      next: (res) => {
        if (res.user.role !== 'ADMIN') {
          this.snack.open('No tienes permisos de administrador', 'OK', { duration: 3000 });
          this.loading.set(false);
          return;
        }
        localStorage.setItem('token', res.accessToken);
        this.router.navigate(['/drivers']);
      },
      error: (e) => { this.snack.open(e.error?.message ?? 'Código inválido', 'OK', { duration: 3000 }); this.loading.set(false); },
    });
  }
}
