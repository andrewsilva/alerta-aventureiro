import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Problema, ProblemaDetalhe, StatusProblema, TipoProblema } from './modelos';

export interface NovoProblema {
  tipo: TipoProblema;
  latitude: number;
  longitude: number;
  descricao?: string;
  referenciaEndereco?: string;
  foto?: Blob | null;
  forcarNovo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProblemasService {
  private readonly http = inject(HttpClient);

  listar(status?: StatusProblema) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return firstValueFrom(this.http.get<Problema[]>('/api/problemas', { params }));
  }

  detalhar(id: string) {
    return firstValueFrom(this.http.get<ProblemaDetalhe>(`/api/problemas/${id}`));
  }

  registrar(p: NovoProblema) {
    const form = new FormData();
    form.set('tipo', p.tipo);
    form.set('latitude', String(p.latitude));
    form.set('longitude', String(p.longitude));
    if (p.descricao) form.set('descricao', p.descricao);
    if (p.referenciaEndereco) form.set('referenciaEndereco', p.referenciaEndereco);
    if (p.forcarNovo) form.set('forcarNovo', 'true');
    if (p.foto) form.set('foto', p.foto, 'foto.jpg');
    return firstValueFrom(this.http.post<Problema>('/api/problemas', form));
  }

  confirmar(id: string) {
    return firstValueFrom(this.http.post<{ totalConfirmacoes: number }>(`/api/problemas/${id}/confirmacoes`, {}));
  }

  mudarStatus(id: string, status: 'AVISADO_PREFEITURA' | 'EM_ANDAMENTO', protocolo156?: string) {
    return firstValueFrom(this.http.patch<Problema>(`/api/problemas/${id}/status`, { status, protocolo156 }));
  }

  resolver(id: string, foto: Blob) {
    const form = new FormData();
    form.set('foto', foto, 'depois.jpg');
    return firstValueFrom(this.http.post<Problema>(`/api/problemas/${id}/resolucao`, form));
  }

  contestar(id: string, motivo: string) {
    return firstValueFrom(this.http.post<Problema>(`/api/problemas/${id}/contestacoes`, { motivo }));
  }
}
