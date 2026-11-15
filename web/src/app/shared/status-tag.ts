import { Component, computed, input } from '@angular/core';
import { STATUS, type StatusProblema } from '../core/modelos';

/** Etiqueta de status com texto, símbolo e cor: a cor nunca é a única informação (RNF04). */
@Component({
  selector: 'app-status-tag',
  template: `<span class="tag {{ info().classe }}"><span aria-hidden="true">{{ info().icone }}</span> {{ info().rotulo }}</span>`,
})
export class StatusTag {
  readonly status = input.required<StatusProblema>();
  protected readonly info = computed(() => STATUS[this.status()]);
}
