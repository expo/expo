import { ImageSource } from '../Image.types';

function hashToUri(type: 'blurhash' | 'thumbhash', hash: string): string {
  const encodedBlurhash = encodeURI(hash).replace(/#/g, '%23').replace(/\?/g, '%3F');
  return `${type}:/${encodedBlurhash}`;
}

export function resolveBlurhashString(str: string): ImageSource {
  const [blurhash, width, height] = str.replace(/^blurhash:\//, '').split('/');
  return {
    uri: hashToUri('blurhash', blurhash),
    width: parseInt(width, 10) || 16,
    height: parseInt(height, 10) || 16,
  };
}

export function resolveThumbhashString(str: string): ImageSource {
  const thumbhash = str.replace(/^thumbhash:\//, '');
  return {
    uri: hashToUri('thumbhash', thumbhash),
  };
}
