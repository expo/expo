import { ImageSource } from '../Image.types';

export function resolveBlurhashString(str: string): ImageSource {
  const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
  return {
    uri: blurhash,
    width: parseInt(width, 10) || 16,
    height: parseInt(height, 10) || 16,
  };
}

export function resolveThumbhashString(str: string): ImageSource {
  const hash = str.replace(/^thumbhash:\//, '');
  return {
    uri: 'thumbhash:/' + hash,
  };
}
