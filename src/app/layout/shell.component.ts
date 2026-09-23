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
          <div class="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/></svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">ADVANCE<span class="cyan"> 24</span></span>
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
            <span>Conductores</span>
          </a>
          <a class="nav-item" routerLink="/trips" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="11" width="20" height="8" rx="2"/><path d="M5 11V8a7 7 0 0 1 14 0v3"/><circle cx="7" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></svg>
            <span>Viajes</span>
          </a>
          <a class="nav-item" routerLink="/documents/expiring" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Vencimientos</span>
          </a>
          <a class="nav-item" routerLink="/tarifas" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Tarifas</span>
          </a>
          <a class="nav-item" routerLink="/precios" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
            <span>Destinos</span>
          </a>
          <a class="nav-item" routerLink="/campanas" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Campañas</span>
          </a>
          <div class="nav-sep"></div>
          <a class="nav-item" routerLink="/mapa" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            <span>Mapa live</span>
          </a>
          <a class="nav-item" routerLink="/calificaciones" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Calificaciones</span>
          </a>
          <a class="nav-item" routerLink="/config" routerLinkActive="active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>
            <span>Configuración</span>
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
      background: linear-gradient(135deg, #001a4d, #003080);
      border: 2px solid #00d4e8;
      display: flex; align-items: center; justify-content: center;
      color: #00d4e8;
      box-shadow: 0 0 14px rgba(0,212,232,.5);
      flex-shrink: 0;
      svg { width: 20px; height: 20px; }
    }
    .brand-name {
      font-family: 'Orbitron', sans-serif; font-size: 14px;
      font-weight: 800; letter-spacing: 1px; color: #fff;
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

    .nav-sep { height: 1px; background: #1e1e1e; margin: 8px 12px; }

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
