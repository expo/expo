import fs from 'fs/promises';
import path from 'path';

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

const weightMap: Record<string, number> = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};
const weights = Object.keys(weightMap).sort((a, b) => b.length - a.length);

export function getFontWeight(filename: string) {
  for (const weight of weights) {
    if (filename.toLowerCase().includes(weight)) {
      return weightMap[weight];
    }
  }

  return 400;
}

export function generateFontFamilyXml(files: string[]) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<font-family xmlns:app="http://schemas.android.com/apk/res-auto">\n`;

  files.forEach((file) => {
    const filename = path.basename(file, path.extname(file));
    const fontWeight = getFontWeight(filename);
    const fontStyle = filename.toLowerCase().includes('italic') ? 'italic' : 'normal';

    xml += `    <font app:fontStyle="${fontStyle}" app:fontWeight="${fontWeight}" app:font="@font/${filename}" />\n`;
  });

  xml += `</font-family>\n`;
  return xml;
}
