export async function generateImageAsync(input: { projectRoot: string }, { src }) {
  if (/^https?:\/\/.*/.test(src)) {
    return { source: Buffer.from('mock-image') };
  }
  const fs = require('fs');
  const path = require('path');
  return { source: fs.readFileSync(input.projectRoot ? path.join(input.projectRoot, src) : src) };
}

export async function generateFaviconAsync(input: any) {
  return input;
}

export async function compositeImagesAsync({ foreground }) {
  return foreground;
}
