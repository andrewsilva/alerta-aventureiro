import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erro';
import { STATUS, rotuloTipo, textoDias, type Problema, type StatusProblema } from '../../core/modelos';
import { ProblemasService } from '../../core/problemas.service';
import { Mapa } from '../../shared/mapa';
import { StatusTag } from '../../shared/status-tag';

@Component({
  selector: 'app-lista',
  imports: [RouterLink, Mapa, StatusTag],
  templateUrl: './lista.html',
})
export class Lista implements OnInit {
  private readonly servico = inject(ProblemasService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly problemas = signal<Problema[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly aviso = signal('');
  protected readonly filtro = signal<StatusProblema | null>(null);
  protected readonly filtros: (StatusProblema | null)[] = [null, 'ABERTO', 'AVISADO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO'];
  protected readonly STATUS = STATUS;
  protected readonly rotuloTipo = rotuloTipo;
  protected readonly textoDias = textoDias;

  ngOnInit() { this.carregar(); }

  async carregar() {
    this.carregando.set(true);
    this.erro.set('');
    try {
      this.problemas.set(await this.servico.listar(this.filtro() ?? undefined));
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.carregando.set(false);
    }
  }

  filtrar(f: StatusProblema | null) {
    this.filtro.set(f);
    this.carregar();
  }

  podeConfirmar(p: Problema) {
    return p.status !== 'RESOLVIDO' && this.auth.morador()?.id !== p.autorId;
  }

  async confirmar(p: Problema) {
    if (!this.auth.logado()) {
      this.router.navigate(['/conta'], { queryParams: { voltar: '/' } });
      return;
    }
    this.aviso.set('');
    try {
      const { totalConfirmacoes } = await this.servico.confirmar(p.id);
      this.problemas.update((l) => l.map((x) => (x.id === p.id ? { ...x, totalConfirmacoes } : x)));
      this.aviso.set('Sua confirmação foi registrada. Obrigado!');
    } catch (e) {
      this.aviso.set(mensagemDeErro(e));
    }
  }

  abrirProblema(id: string) {
    this.router.navigate(['/problemas', id]);
  }
}
