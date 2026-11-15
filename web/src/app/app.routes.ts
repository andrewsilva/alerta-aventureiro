import { inject } from '@angular/core';
import { Router, type CanActivateFn, type Routes } from '@angular/router';
import { AuthService } from './core/auth.service';

const exigeLogin: CanActivateFn = (_r, estado) =>
  inject(AuthService).logado() ? true : inject(Router).createUrlTree(['/conta'], { queryParams: { voltar: estado.url } });

export const routes: Routes = [
  { path: '', title: 'Problemas perto de você · Alerta Aventureiro', loadComponent: () => import('./pages/lista/lista').then((m) => m.Lista) },
  { path: 'registrar', title: 'Registrar problema · Alerta Aventureiro', canActivate: [exigeLogin], loadComponent: () => import('./pages/registrar/registrar').then((m) => m.Registrar) },
  { path: 'conta', title: 'Conta · Alerta Aventureiro', loadComponent: () => import('./pages/conta/conta').then((m) => m.Conta) },
  { path: '**', redirectTo: '' },
];
