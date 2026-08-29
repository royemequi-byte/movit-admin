import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'drivers', loadComponent: () => import('./features/drivers/drivers-list.component').then(m => m.DriversListComponent) },
      { path: 'drivers/:id', loadComponent: () => import('./features/drivers/driver-detail.component').then(m => m.DriverDetailComponent) },
      { path: 'documents/expiring', loadComponent: () => import('./features/documents/expiring-docs.component').then(m => m.ExpiringDocsComponent) },
      { path: 'trips', loadComponent: () => import('./features/trips/trips-list.component').then(m => m.TripsListComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
