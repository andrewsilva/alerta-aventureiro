const RAIO_TERRA_METROS = 6_371_000;

export interface Coordenada { latitude: number; longitude: number }
export interface Limites { latMin: number; latMax: number; lngMin: number; lngMax: number }

/** Distância em metros entre dois pontos pela fórmula de Haversine. */
export function distanciaEmMetros(a: Coordenada, b: Coordenada): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
}

export function dentroDoBairro(p: Coordenada, l: Limites): boolean {
  return p.latitude >= l.latMin && p.latitude <= l.latMax && p.longitude >= l.lngMin && p.longitude <= l.lngMax;
}

/** Caixa aproximada em graus ao redor de um ponto, usada para pré-filtrar no banco antes do cálculo exato. */
export function caixaAoRedor(p: Coordenada, raioMetros: number): Limites {
  const dLat = raioMetros / 111_320;
  const dLng = raioMetros / (111_320 * Math.cos((p.latitude * Math.PI) / 180));
  return { latMin: p.latitude - dLat, latMax: p.latitude + dLat, lngMin: p.longitude - dLng, lngMax: p.longitude + dLng };
}
