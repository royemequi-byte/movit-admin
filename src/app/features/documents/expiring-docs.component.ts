import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService, Document } from '../../core/services/api.service';

interface ExpiringDoc extends Document {
  driver: { user: { firstName: string; lastName: string; phone: string } };
}

@Component({
  selector: 'app-expiring-docs',
  standalone: true,
  imports: [DatePipe, MatTableModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule],
  template: `
    <div class="page-container">
      <h1><mat-icon color="warn">warning</mat-icon> Documentos próximos a vencer (30 días)</h1>

      @if (loading()) {
        <div class="center"><mat-spinner /></div>
      } @else {
        <table mat-table [dataSource]="docs()" class="mat-elevation-z2">
          <ng-container matColumnDef="driver">
            <th mat-header-cell *matHeaderCellDef>Conductora</th>
            <td mat-cell *matCellDef="let d">{{ d.driver.user.firstName }} {{ d.driver.user.lastName }}</td>
          </ng-container>
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Teléfono</th>
            <td mat-cell *matCellDef="let d">{{ d.driver.user.phone }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Documento</th>
            <td mat-cell *matCellDef="let d">{{ d.type }}</td>
          </ng-container>
          <ng-container matColumnDef="expires">
            <th mat-header-cell *matHeaderCellDef>Vence</th>
            <td mat-cell *matCellDef="let d" [class.urgent]="isUrgent(d.expiresAt)">
              {{ d.expiresAt | date:'dd/MM/yyyy' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="file">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <a [href]="d.fileUrl" target="_blank" mat-icon-button><mat-icon>open_in_new</mat-icon></a>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
        @if (docs().length === 0) {
          <p class="empty">No hay documentos próximos a vencer. ✓</p>
        }
      }
    </div>
  `,
  styles: [`
    h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin-bottom: 16px; }
    table { width: 100%; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .empty { text-align: center; padding: 32px; color: #2e7d32; font-size: 16px; }
    .urgent { color: #c62828; font-weight: bold; }
  `],
})
export class ExpiringDocsComponent implements OnInit {
  private api = inject(ApiService);
  docs = signal<ExpiringDoc[]>([]);
  loading = signal(true);
  cols = ['driver', 'phone', 'type', 'expires', 'file'];

  ngOnInit() {
    this.api.getExpiringDocuments(30).subscribe({
      next: (d) => { this.docs.set(d as ExpiringDoc[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isUrgent(date?: string) {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }
}
