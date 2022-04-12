export async function generateImageAsync(input: any, { src }) {
  const fs = require('fs');
  return { source: fs.readFileSync(src) };
}

export async function compositeImagesAsync({ foreground }) {
  return foreground;
}
