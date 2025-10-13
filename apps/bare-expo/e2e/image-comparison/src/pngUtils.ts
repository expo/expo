import fs from 'node:fs/promises';
import { PNG } from 'pngjs';

export async function readPNG(filePath: string): Promise<PNG> {
  const buffer = await fs.readFile(filePath);
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(buffer, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

export async function writePNG(png: PNG, filePath: string): Promise<void> {
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    png.pack();
    png.on('data', (chunk: Buffer) => chunks.push(chunk));
    png.on('end', () => resolve(Buffer.concat(chunks)));
    png.on('error', reject);
  });
  await fs.writeFile(filePath, buffer);
}
