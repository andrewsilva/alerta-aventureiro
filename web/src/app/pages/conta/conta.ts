import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erro';

@Component({
  selector: 'app-conta',
  imports: [FormsModule],
  templateUrl: './conta.html',
})
export class Conta {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly voltar = input<string>();

  protected readonly modo = signal<'entrar' | 'cadastrar'>('entrar');
  protected readonly erro = signal('');
  protected readonly enviando = signal(false);
  protected dados = { nome: '', celular: '', senha: '', aceiteTermos: false };

  async enviar() {
    this.erro.set('');
    this.enviando.set(true);
    try {
      if (this.modo() === 'entrar') await this.auth.entrar(this.dados.celular, this.dados.senha);
      else await this.auth.cadastrar(this.dados);
      this.dados.senha = '';
      this.router.navigateByUrl(this.voltar() || '/');
    } catch (e) {
      this.erro.set(mensagemDeErro(e));
    } finally {
      this.enviando.set(false);
    }
  }

  trocar(m: 'entrar' | 'cadastrar') { this.modo.set(m); this.erro.set(''); }
}
