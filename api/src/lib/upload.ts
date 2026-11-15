import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const EXTENSOES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export function criarUpload(pasta: string) {
  mkdirSync(pasta, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: pasta,
      // Nome gerado pelo servidor: o nome original do arquivo nunca é usado.
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXTENSOES[file.mimetype]}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => (EXTENSOES[file.mimetype] ? cb(null, true) : cb(new Error('ARQUIVO_INVALIDO'))),
  });
}

export const urlDoArquivo = (arquivo?: Express.Multer.File) => (arquivo ? `/uploads/${path.basename(arquivo.filename)}` : undefined);
