import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Problemas perto de você · Alerta Aventureiro', loadComponent: () => import('./pages/lista/lista').then((m) => m.Lista) },
  { path: 'conta', title: 'Conta · Alerta Aventureiro', loadComponent: () => import('./pages/conta/conta').then((m) => m.Conta) },
  { path: '**', redirectTo: '' },
];
