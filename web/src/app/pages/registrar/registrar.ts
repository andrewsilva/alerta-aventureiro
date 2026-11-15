import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, inject, Injector, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { mensagemDeErro } from '../../core/erro';
import { comprimirImagem } from '../../core/imagem';
import { TIPOS, rotuloTipo, textoDias, type Problema, type TipoProblema } from '../../core/modelos';
import { ProblemasService } from '../../core/problemas.service';
import { Mapa } from '../../shared/mapa';
import { StatusTag } from '../../shared/status-tag';

@Component({
  selector: 'app-registrar',
  imports: [FormsModule, Mapa, StatusTag],
  templateUrl: './registrar.html',
  host: {
    '(window:online)': 'online.set(true)',
    '(window:offline)': 'online.set(false)',
  },
})
export class Registrar {
  private readonly servico = inject(ProblemasService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly TIPOS = TIPOS;
  protected readonly rotuloTipo = rotuloTipo;
  protected readonly textoDias = textoDias;
  protected tipo: TipoProblema | null = null;
  protected descricao = '';
  protected referencia = '';
  protected readonly ponto = signal<{ latitude: number; longitude: number } | null>(null);
  protected readonly foto = signal<Blob | null>(null);
  protected readonly nomeFoto = signal('');
  protected readonly preparandoFoto = signal(false);
  protected readonly gps = signal<'parado' | 'buscando' | 'erro'>('parado');
  protected readonly erros = signal<{ tipo?: string; local?: string; geral?: string }>({});
  protected readonly enviando = signal(false);
  protected readonly parecidos = signal<Problema[]>([]);
  protected readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  usarGps() {
    if (!('geolocation' in navigator)) { this.gps.set('erro'); return; }
    this.gps.set('buscando');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.escolherNoMapa({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        this.gps.set('parado');
      },
      () => this.gps.set('erro'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }

  escolherNoMapa(p: { latitude: number; longitude: number }) {
    this.ponto.set(p);
    this.parecidos.set([]);
    this.limparErro('local');
  }

  async escolherFoto(ev: Event) {
    const arquivo = (ev.target as HTMLInputElement).files?.[0];
    if (!arquivo || this.preparandoFoto()) return;
    this.preparandoFoto.set(true);
    this.foto.set(null);
    this.nomeFoto.set('');
    this.limparErro('geral');
    try {
      this.foto.set(await comprimirImagem(arquivo));
      this.nomeFoto.set(arquivo.name);
    } catch {
      this.erros.update((e) => ({ ...e, geral: 'Não foi possível usar essa foto. Tente outra.' }));
    } finally {
      this.preparandoFoto.set(false);
    }
  }

  async enviar(forcarNovo = false) {
    if (this.enviando() || this.preparandoFoto()) return;
    const e: { tipo?: string; local?: string } = {};
    if (!this.tipo) e.tipo = 'Escolha o tipo do problema.';
    if (!this.ponto()) e.local = 'Marque o local: toque em "Usar GPS" ou toque no mapa.';
    this.erros.set(e);
    if (e.tipo || e.local) {
      document.getElementById(e.tipo ? 'tipos' : 'local')?.focus();
      return;
    }
    this.enviando.set(true);
    try {
      await this.servico.registrar({
        tipo: this.tipo!, ...this.ponto()!, descricao: this.descricao.trim() || undefined,
        referenciaEndereco: this.referencia.trim() || undefined, foto: this.foto(), forcarNovo,
      });
      await this.router.navigate(['/'], { state: { mensagem: 'Registro enviado. Obrigado por avisar o bairro!' } });
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409 && err.error?.detalhes?.parecidos) {
        this.parecidos.set(err.error.detalhes.parecidos);
        afterNextRender(() => document.getElementById('parecidos')?.focus(), { injector: this.injector });
      } else {
        this.erros.set({ geral: mensagemDeErro(err) });
      }
    } finally {
      this.enviando.set(false);
    }
  }

  async confirmarExistente(p: Problema) {
    if (this.enviando()) return;
    this.enviando.set(true);
    try {
      await this.servico.confirmar(p.id);
      await this.router.navigate(['/'], { state: { mensagem: 'Sua confirmação foi registrada. Obrigado!' } });
    } catch (err) {
      this.erros.set({ geral: mensagemDeErro(err) });
    } finally {
      this.enviando.set(false);
    }
  }

  private limparErro(campo: 'tipo' | 'local' | 'geral') {
    this.erros.update((e) => ({ ...e, [campo]: undefined }));
  }

  protected escolherTipo() {
    this.parecidos.set([]);
    this.limparErro('tipo');
  }
}
