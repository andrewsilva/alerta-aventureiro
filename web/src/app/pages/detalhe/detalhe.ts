import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erro';
import { comprimirImagem } from '../../core/imagem';
import { EVENTOS, rotuloTipo, textoDias, type ProblemaDetalhe, type StatusProblema } from '../../core/modelos';
import { ProblemasService } from '../../core/problemas.service';
import { StatusTag } from '../../shared/status-tag';

const ETAPAS: { status: StatusProblema; rotulo: string }[] = [
  { status: 'ABERTO', rotulo: 'Registrado' },
  { status: 'AVISADO_PREFEITURA', rotulo: 'Avisado à prefeitura' },
  { status: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { status: 'RESOLVIDO', rotulo: 'Resolvido' },
];
const PRAZO_CONTESTACAO_MS = 7 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-detalhe',
  imports: [FormsModule, RouterLink, StatusTag],
  templateUrl: './detalhe.html',
})
export class Detalhe implements OnInit {
  private readonly servico = inject(ProblemasService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  readonly id = input.required<string>();

  protected readonly p = signal<ProblemaDetalhe | null>(null);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly ocupado = signal(false);
  protected readonly painel = signal<'nenhum' | 'protocolo' | 'contestar'>('nenhum');
  protected protocolo = '';
  protected motivo = '';
  protected readonly EVENTOS = EVENTOS;
  protected readonly rotuloTipo = rotuloTipo;
  protected readonly textoDias = textoDias;

  protected readonly etapas = computed(() => {
    const p = this.p();
    if (!p) return [];
    const atual = ETAPAS.findIndex((e) => e.status === p.status);
    const historicoRecente = [...p.historico].reverse();
    return ETAPAS.map((e, i) => {
      const evento = historicoRecente.find((h) => h.statusNovo === e.status);
      const estado = i < atual ? (evento ? 'feito' : 'pulado') : i === atual ? (e.status === 'RESOLVIDO' ? 'feito' : 'atual') : 'pendente';
      let detalhe = evento ? `${new Date(evento.criadoEm).toLocaleDateString('pt-BR')} · por ${evento.autorNome}` : '';
      if (e.status === 'AVISADO_PREFEITURA' && p.protocolo156) detalhe = `Protocolo 156: ${p.protocolo156}`;
      if (e.status === 'RESOLVIDO' && estado === 'pendente') detalhe = 'precisa de foto do depois e confirmação';
      if (estado === 'pendente' && e.status !== 'RESOLVIDO') detalhe = 'ainda não aconteceu';
      if (estado === 'pulado') detalhe = 'etapa não informada pelos moradores';
      return { ...e, estado, detalhe };
    });
  });

  protected readonly contestacoes = computed(() => this.p()?.historico.filter((h) => h.tipoEvento === 'CONTESTACAO') ?? []);
  protected readonly podeContestar = computed(() => {
    const p = this.p();
    return !!p && p.status === 'RESOLVIDO' && !!p.resolvidoEm && Date.now() - new Date(p.resolvidoEm).getTime() <= PRAZO_CONTESTACAO_MS;
  });

  ngOnInit() {
    const mensagem: unknown = this.router.currentNavigation()?.extras.state?.['mensagem'];
    if (typeof mensagem === 'string') this.mensagem.set(mensagem);
    this.carregar();
  }

  async carregar() {
    try {
      this.p.set(await this.servico.detalhar(this.id()));
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    }
  }

  private async executar(acao: () => Promise<unknown>, sucesso: string) {
    if (this.ocupado()) return;
    if (!this.auth.logado()) { this.router.navigate(['/conta'], { queryParams: { voltar: this.router.url } }); return; }
    this.ocupado.set(true);
    this.erro.set('');
    try {
      await acao();
      this.mensagem.set(sucesso);
      this.painel.set('nenhum');
      await this.carregar();
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.ocupado.set(false);
    }
  }

  confirmar() { return this.executar(() => this.servico.confirmar(this.id()), 'Sua confirmação foi registrada. Obrigado!'); }
  avisarPrefeitura() { return this.executar(() => this.servico.mudarStatus(this.id(), 'AVISADO_PREFEITURA', this.protocolo.trim()), 'Protocolo do 156 registrado.'); }
  emAndamento() { return this.executar(() => this.servico.mudarStatus(this.id(), 'EM_ANDAMENTO'), 'Marcado como em andamento.'); }
  contestar() { return this.executar(() => this.servico.contestar(this.id(), this.motivo.trim()), 'Contestação registrada. O problema voltou para em andamento.'); }

  async resolver(ev: Event) {
    const campo = ev.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    if (!arquivo) return;
    campo.value = '';
    await this.executar(async () => {
      const foto = await comprimirImagem(arquivo);
      await this.servico.resolver(this.id(), foto);
    }, 'Marcado como resolvido com a foto do depois.');
  }
}
