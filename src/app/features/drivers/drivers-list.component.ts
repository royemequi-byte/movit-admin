import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, Driver } from '../../core/services/api.service';

@Component({
  selector: 'app-drivers-list',
  standalone: true,
  imports: [RouterLink, FormsModule, MatTableModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div class="header-row">
        <h1>Conductoras</h1>
        <mat-form-field appearance="outline" class="filter">
          <mat-label>Filtrar estado</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="load()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="PENDING">Pendientes</mat-option>
            <mat-option value="APPROVED">Aprobadas</mat-option>
            <mat-option value="SUSPENDED">Suspendidas</mat-option>
            <mat-option value="REJECTED">Rechazadas</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner /></div>
      } @else {
        <table mat-table [dataSource]="drivers()" class="mat-elevation-z2">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let d">{{ d.user.firstName }} {{ d.user.lastName }}</td>
          </ng-container>
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
            <td mat-cell *matCellDef="let d">{{ d.user.phone }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let d">
              <span class="status-badge {{ d.status }}">{{ d.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="docs">
            <th mat-header-cell *matHeaderCellDef>Docs</th>
            <td mat-cell *matCellDef="let d">{{ d.documents.length }}</td>
          </ng-container>
          <ng-container matColumnDef="vehicles">
            <th mat-header-cell *matHeaderCellDef>Vehículos</th>
            <td mat-cell *matCellDef="let d">{{ d.vehicles.length }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <a mat-icon-button [routerLink]="['/drivers', d.id]" color="primary">
                <mat-icon>visibility</mat-icon>
              </a>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
        @if (drivers().length === 0) {
          <p class="empty">No hay conductoras con este filtro.</p>
        }
      }
    </div>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 500; }
    .filter { width: 200px; }
    table { width: 100%; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .empty { text-align: center; padding: 32px; color: #666; }
  `],
})
export class DriversListComponent implements OnInit {
  private api = inject(ApiService);
  drivers = signal<Driver[]>([]);
  loading = signal(true);
  statusFilter = '';
  cols = ['name', 'phone', 'status', 'docs', 'vehicles', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getDrivers(this.statusFilter || undefined).subscribe({
      next: (d) => { this.drivers.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
