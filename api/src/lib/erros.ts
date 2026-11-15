export class ErroDeNegocio extends Error {
  constructor(public readonly status: number, message: string, public readonly detalhes?: unknown) {
    super(message);
  }
}

export const naoEncontrado = (msg = 'Não encontrado') => new ErroDeNegocio(404, msg);
export const proibido = (msg = 'Você não tem permissão para esta ação') => new ErroDeNegocio(403, msg);
export const conflito = (msg: string, detalhes?: unknown) => new ErroDeNegocio(409, msg, detalhes);
export const regraViolada = (msg: string) => new ErroDeNegocio(422, msg);
