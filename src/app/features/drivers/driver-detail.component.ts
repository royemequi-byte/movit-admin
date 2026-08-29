import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService, Driver } from '../../core/services/api.service';

@Component({
  selector: 'app-driver-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatSnackBarModule, MatProgressSpinnerModule, MatChipsModule],
  template: `
    <div class="page-container">
      <a mat-button routerLink="/drivers"><mat-icon>arrow_back</mat-icon> Volver</a>

      @if (loading()) {
        <div class="center"><mat-spinner /></div>
      } @else if (driver()) {
        <div class="layout">
          <!-- Info conductora -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ driver()!.user.firstName }} {{ driver()!.user.lastName }}</mat-card-title>
              <mat-card-subtitle>{{ driver()!.user.phone }} · {{ driver()!.user.email }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Estado: <span class="status-badge {{ driver()!.status }}">{{ driver()!.status }}</span></p>
              <p>Viajes: {{ driver()!.totalTrips }} · Calificación: {{ driver()!.rating | number:'1.1-1' }}</p>
            </mat-card-content>
            <mat-card-actions>
              @if (driver()!.status === 'PENDING') {
                <button mat-raised-button color="primary" (click)="setStatus('APPROVED')">Aprobar</button>
                <button mat-raised-button color="warn" (click)="setStatus('REJECTED')">Rechazar</button>
              }
              @if (driver()!.status === 'APPROVED') {
                <button mat-raised-button color="warn" (click)="setStatus('SUSPENDED')">Suspender</button>
              }
              @if (driver()!.status === 'SUSPENDED') {
                <button mat-raised-button color="primary" (click)="setStatus('APPROVED')">Reactivar</button>
              }
            </mat-card-actions>
          </mat-card>

          <!-- Documentos -->
          <mat-card>
            <mat-card-header><mat-card-title>Documentos</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (doc of driver()!.documents; track doc.id) {
                <div class="doc-row">
                  <div>
                    <strong>{{ doc.type }}</strong>
                    @if (doc.expiresAt) { <span class="expire"> · Vence {{ doc.expiresAt | date:'dd/MM/yyyy' }}</span> }
                  </div>
                  <div class="doc-actions">
                    <a [href]="doc.fileUrl" target="_blank" mat-icon-button><mat-icon>open_in_new</mat-icon></a>
                    @if (!doc.isVerified) {
                      <button mat-icon-button color="primary" (click)="verifyDoc(doc.id, true)" title="Verificar">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                    } @else {
                      <mat-icon color="primary" title="Verificado">verified</mat-icon>
                    }
                  </div>
                </div>
                <mat-divider />
              }
              @if (driver()!.documents.length === 0) { <p class="empty">Sin documentos</p> }
            </mat-card-content>
          </mat-card>

          <!-- Vehículos -->
          <mat-card>
            <mat-card-header><mat-card-title>Vehículos</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (v of driver()!.vehicles; track v.id) {
                <p>
                  <mat-icon>{{ v.type === 'CAR' ? 'directions_car' : 'two_wheeler' }}</mat-icon>
                  {{ v.brand }} {{ v.model }} {{ v.year }} · <strong>{{ v.plate }}</strong> · {{ v.color }}
                </p>
              }
              @if (driver()!.vehicles.length === 0) { <p class="empty">Sin vehículos</p> }
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .layout { display: grid; gap: 16px; margin-top: 16px; }
    .center { display: flex; justify-content: center; padding: 48px; }
    mat-card-actions { padding: 8px 16px; display: flex; gap: 8px; }
    .doc-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .doc-actions { display: flex; align-items: center; gap: 4px; }
    .expire { color: #e65100; font-size: 13px; }
    .empty { color: #999; font-size: 14px; padding: 8px 0; }
  `],
})
export class DriverDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  driver = signal<Driver | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getDriver(id).subscribe({
      next: (d) => { this.driver.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setStatus(status: string) {
    const id = this.driver()!.id;
    this.api.updateDriverStatus(id, status).subscribe({
      next: () => {
        this.driver.update(d => d ? { ...d, status: status as Driver['status'] } : d);
        this.snack.open('Estado actualizado', '', { duration: 2000 });
      },
      error: () => this.snack.open('Error actualizando estado', 'OK', { duration: 3000 }),
    });
  }

  verifyDoc(docId: string, isVerified: boolean) {
    this.api.verifyDocument(docId, isVerified).subscribe({
      next: () => {
        this.driver.update(d => d ? {
          ...d,
          documents: d.documents.map(doc => doc.id === docId ? { ...doc, isVerified } : doc),
        } : d);
        this.snack.open('Documento verificado', '', { duration: 2000 });
      },
      error: () => this.snack.open('Error verificando documento', 'OK', { duration: 3000 }),
    });
  }
}
