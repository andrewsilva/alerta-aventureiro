/** Reduz a foto no próprio celular para no máximo 1280 px e qualidade 0,7 (RNF03), economizando dados móveis. */
export async function comprimirImagem(arquivo: File, ladoMaximo = 1280, qualidade = 0.7): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  try {
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Falha ao preparar a imagem');
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao comprimir a imagem'))), 'image/jpeg', qualidade));
}
