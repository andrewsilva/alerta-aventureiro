import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { StatusTag } from './status-tag';

describe('StatusTag', () => {
  it('mostra o status por texto e símbolo, além da cor', async () => {
    const fixture = TestBed.createComponent(StatusTag);
    fixture.componentRef.setInput('status', 'AVISADO_PREFEITURA');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Avisado à prefeitura');
    expect(el.textContent).toContain('✉');
    expect(el.querySelector('.tag')?.classList).toContain('t-avisado');
  });
});
