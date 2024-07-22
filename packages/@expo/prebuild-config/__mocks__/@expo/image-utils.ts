export async function createSquareAsync(...args) {
  return jest.requireActual('@expo/image-utils').createSquareAsync(...args);
}

export async function generateImageAsync(input: any, { src }) {
  const fs = require('fs');
  return { source: fs.readFileSync(src) };
}

export async function compositeImagesAsync({ foreground }) {
  return foreground;
}
