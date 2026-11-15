import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <router-outlet />
      <nav class="nav" aria-label="Menu principal">
        <a routerLink="/registrar" routerLinkActive="ativo" ariaCurrentWhenActive="page"><span class="ico" aria-hidden="true">➕</span>Registrar</a>
        <a routerLink="/" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page"><span class="ico" aria-hidden="true">🗺</span>Problemas</a>
        <a routerLink="/conta" routerLinkActive="ativo" ariaCurrentWhenActive="page"><span class="ico" aria-hidden="true">👤</span>Conta</a>
      </nav>
    </div>
  `,
})
export class App {}
