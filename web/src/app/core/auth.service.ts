import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Sessao } from './modelos';

const CHAVE = 'alerta-aventureiro.sessao';

function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as Sessao;
    const payload = JSON.parse(atob(sessao.token.split('.')[1]));
    return payload.exp * 1000 > Date.now() ? sessao : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly sessao = signal<Sessao | null>(lerSessao());
  readonly logado = computed(() => this.sessao() !== null);
  readonly morador = computed(() => this.sessao()?.morador ?? null);

  async entrar(celular: string, senha: string) {
    this.salvar(await firstValueFrom(this.http.post<Sessao>('/api/auth/login', { celular, senha })));
  }

  async cadastrar(dados: { nome: string; celular: string; senha: string; aceiteTermos: boolean }) {
    this.salvar(await firstValueFrom(this.http.post<Sessao>('/api/auth/cadastro', dados)));
  }

  sair() {
    try { localStorage.removeItem(CHAVE); } catch { /* armazenamento indisponível */ }
    this.sessao.set(null);
  }

  token(): string | null {
    const s = lerSessao();
    if (!s && this.sessao()) this.sessao.set(null);
    return s?.token ?? null;
  }

  private salvar(s: Sessao) {
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { /* segue só em memória */ }
    this.sessao.set(s);
  }
}
