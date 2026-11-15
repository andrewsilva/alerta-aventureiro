import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { CENTRO_BAIRRO, STATUS, rotuloTipo, type Problema } from '../core/modelos';

const CORES: Record<string, string> = { ABERTO: '#B42318', AVISADO_PREFEITURA: '#B54708', EM_ANDAMENTO: '#1E429F', RESOLVIDO: '#057A55' };

@Component({
  selector: 'app-mapa',
  template: `<div #alvo class="mapa" role="region" [attr.aria-label]="rotulo()"></div>`,
})
export class Mapa implements AfterViewInit, OnDestroy {
  readonly problemas = input<Problema[]>([]);
  readonly ponto = input<{ latitude: number; longitude: number } | null>(null);
  readonly selecionavel = input(false);
  readonly rotulo = input('Mapa do bairro Aventureiro');
  readonly pontoEscolhido = output<{ latitude: number; longitude: number }>();
  readonly problemaTocado = output<string>();

  private readonly alvo = viewChild.required<ElementRef<HTMLDivElement>>('alvo');
  private mapa?: L.Map;
  private camada = L.layerGroup();
  private marcadorPonto?: L.CircleMarker;

  constructor() {
    effect(() => this.desenharProblemas(this.problemas()));
    effect(() => this.desenharPonto(this.ponto()));
  }

  ngAfterViewInit() {
    this.mapa = L.map(this.alvo().nativeElement, { zoomControl: true, attributionControl: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false })
      .setView([CENTRO_BAIRRO.latitude, CENTRO_BAIRRO.longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.mapa);
    this.camada.addTo(this.mapa);
    if (this.selecionavel()) {
      this.mapa.on('click', (e: L.LeafletMouseEvent) => this.pontoEscolhido.emit({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    }
    this.desenharProblemas(this.problemas());
    this.desenharPonto(this.ponto());
  }

  ngOnDestroy() {
    this.mapa?.off();
    this.mapa?.remove();
    this.mapa = undefined;
  }

  private desenharProblemas(lista: Problema[]) {
    if (!this.mapa) return;
    this.camada.clearLayers();
    for (const p of lista) {
      L.circleMarker([p.latitude, p.longitude], { radius: 10, color: '#fff', weight: 3, fillColor: CORES[p.status], fillOpacity: 1 })
        .bindTooltip(`${rotuloTipo(p.tipo)} · ${STATUS[p.status].rotulo}`)
        .on('click', () => this.problemaTocado.emit(p.id))
        .addTo(this.camada);
    }
    if (lista.length && !this.selecionavel()) {
      this.mapa.fitBounds(L.latLngBounds(lista.map((p) => [p.latitude, p.longitude] as [number, number])), { maxZoom: 16, padding: [24, 24] });
    }
  }

  private desenharPonto(p: { latitude: number; longitude: number } | null) {
    if (!this.mapa) return;
    this.marcadorPonto?.remove();
    if (!p) return;
    this.marcadorPonto = L.circleMarker([p.latitude, p.longitude], { radius: 12, color: '#fff', weight: 3, fillColor: '#0B4F6C', fillOpacity: 1 })
      .bindTooltip('Local do problema').addTo(this.mapa);
    this.mapa.setView([p.latitude, p.longitude], Math.max(this.mapa.getZoom(), 17));
  }
}
