import { ImageSource } from '../Image.types';

function blurhashToURI(blurhash: string): string {
  const encodedBlurhash = encodeURI(blurhash).replace(/#/g, '%23').replace(/\?/g, '%3F');
  return `blurhash:/${encodedBlurhash}`;
}

export default function resolveBlurhashString(str: string): ImageSource {
  const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
  return {
    uri: blurhashToURI(blurhash),
    width: parseInt(width, 10) || 16,
    height: parseInt(height, 10) || 16,
  };
}
