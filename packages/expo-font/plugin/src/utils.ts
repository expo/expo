import fs from 'fs/promises';
import path from 'path';

import type { FontFiles } from './withFontsAndroid';

export async function resolveFontPaths(fonts: string[], projectRoot: string) {
  const promises = fonts.map(async (p) => {
    const resolvedPath = path.resolve(projectRoot, p);
    const stat = await fs.stat(resolvedPath);

    if (stat.isDirectory()) {
      const dir = await fs.readdir(resolvedPath);
      return dir.map((file) => path.join(resolvedPath, file));
    }
    return [resolvedPath];
  });
  return (await Promise.all(promises))
    .flat()
    .filter(
      (p) => p.endsWith('.ttf') || p.endsWith('.otf') || p.endsWith('.woff') || p.endsWith('.woff2')
    );
}

export async function resolveXmlFontPaths(fonts: FontFiles[], projectRoot: string) {
  const promises = fonts.map(async (p) => {
    const resolvedPath = path.resolve(projectRoot, p.font);
    const stat = await fs.stat(resolvedPath);

    if (stat.isDirectory()) {
      const dir = await fs.readdir(resolvedPath);
      return dir.map((file) => ({ ...p, font: path.join(resolvedPath, file) }));
    }
    return [{ ...p, font: resolvedPath }];
  });
  return (await Promise.all(promises))
    .flat()
    .filter(
      (p) =>
        p.font.endsWith('.ttf') ||
        p.font.endsWith('.otf') ||
        p.font.endsWith('.woff') ||
        p.font.endsWith('.woff2')
    );
}

export function normalizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function generateFontFamilyXml(files: FontFiles[]) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<font-family xmlns:app="http://schemas.android.com/apk/res-auto">\n`;

  files.forEach((file) => {
    const filename = normalizeFilename(path.basename(file.font, path.extname(file.font)));
    xml += `    <font`;
    if (file.fontStyle) {
      xml += ` app:fontStyle="${file.fontStyle}"`;
    }
    if (file.fontWeight) {
      xml += ` app:fontWeight="${file.fontWeight}"`;
    }

    xml += ` app:font="@font/${filename}" />\n`;
  });

  xml += `</font-family>\n`;
  return xml;
}
