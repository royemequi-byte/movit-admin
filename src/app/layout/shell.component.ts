import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">MOVIT-FUSA</div>
        <mat-nav-list>
          <a mat-list-item routerLink="/drivers" routerLinkActive="active-link">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Conductoras</span>
          </a>
          <a mat-list-item routerLink="/documents/expiring" routerLinkActive="active-link">
            <mat-icon matListItemIcon>warning</mat-icon>
            <span matListItemTitle>Vencimientos</span>
          </a>
        </mat-nav-list>
        <div class="sidenav-footer">
          <button mat-button (click)="logout()">
            <mat-icon>logout</mat-icon> Salir
          </button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>Panel de Administración</span>
        </mat-toolbar>
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 220px; display: flex; flex-direction: column; background: #1a237e; color: white; }
    .brand { padding: 20px 16px; font-size: 18px; font-weight: 700; color: white; border-bottom: 1px solid rgba(255,255,255,.15); }
    mat-nav-list { flex: 1; }
    .active-link { background: rgba(255,255,255,.15) !important; }
    mat-icon, span { color: white !important; }
    .sidenav-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.15); }
    .sidenav-footer button { color: white; width: 100%; }
    mat-toolbar { position: sticky; top: 0; z-index: 1; }
  `],
})
export class ShellComponent {
  private router = inject(Router);
  logout() { localStorage.removeItem('token'); this.router.navigate(['/login']); }
}
