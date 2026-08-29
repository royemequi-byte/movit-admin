import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-logo">M</div>
          <div class="brand-text">
            <span class="brand-name">MOVIT<span class="cyan">-FUSA</span></span>
            <span class="brand-sub">Panel Admin</span>
          </div>
        </div>

        <nav class="nav">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" routerLink="/drivers" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Conductoras</span>
          </a>
          <a class="nav-item" routerLink="/trips" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="11" width="20" height="8" rx="2"/><path d="M5 11V8a7 7 0 0 1 14 0v3"/><circle cx="7" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></svg>
            <span>Viajes</span>
          </a>
          <a class="nav-item" routerLink="/documents/expiring" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Vencimientos</span>
          </a>
        </nav>

        <button class="logout" (click)="logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Salir</span>
        </button>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 240px; min-width: 240px;
      background: #0d0d0d;
      border-right: 1px solid #1e1e1e;
      display: flex; flex-direction: column;
    }

    .brand {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid #1e1e1e;
    }
    .brand-logo {
      width: 38px; height: 38px; border-radius: 50%;
      background: #00d4e8; color: #000;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Rajdhani', sans-serif; font-size: 20px; font-weight: 700;
      box-shadow: 0 0 12px rgba(0,212,232,.5);
      flex-shrink: 0;
    }
    .brand-name {
      font-family: 'Rajdhani', sans-serif; font-size: 17px;
      font-weight: 700; letter-spacing: 1px; color: #fff;
    }
    .brand-sub { font-size: 11px; color: #666; letter-spacing: .5px; display: block; margin-top: 1px; }
    .cyan { color: #00d4e8; }

    .nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 14px; border-radius: 8px;
      color: #888; text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: background .15s, color .15s;
      svg { width: 18px; height: 18px; flex-shrink: 0; }
      &:hover { background: #161616; color: #ccc; }
      &.active { background: rgba(0,212,232,.08); color: #00d4e8; border-left: 2px solid #00d4e8; }
    }

    .logout {
      display: flex; align-items: center; gap: 10px;
      margin: 16px 12px; padding: 11px 14px;
      background: none; border: 1px solid #252525;
      border-radius: 8px; color: #666; cursor: pointer;
      font-size: 14px; transition: border-color .2s, color .2s;
      svg { width: 16px; height: 16px; }
      &:hover { border-color: #ff4444; color: #ff4444; }
    }

    .content { flex: 1; overflow-y: auto; background: #0d0d0d; }
  `],
})
export class ShellComponent {
  private router = inject(Router);
  logout() { localStorage.removeItem('token'); this.router.navigate(['/login']); }
}
