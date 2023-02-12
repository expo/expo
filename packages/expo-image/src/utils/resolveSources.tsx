import { ImageNativeProps, ImageProps, ImageSource } from '../Image.types';
import resolveAssetSource from './resolveAssetSource';
import resolveBlurhashString from './resolveBlurhashString';

export function isBlurhashString(str: string): boolean {
  return /^(blurhash:\/)?[\w#$%*+,\-.:;=?@[\]^_{}|~]+(\/[\d.]+)*$/.test(str);
}

function resolveSource(source?: ImageSource | string | number | null): ImageSource | null {
  if (typeof source === 'string') {
    if (isBlurhashString(source)) {
      return resolveBlurhashString(source);
    }
    return { uri: source };
  }
  if (typeof source === 'number') {
    return resolveAssetSource(source);
  }
  if (typeof source === 'object' && source?.blurhash) {
    const { blurhash, ...restSource } = source;
    return {
      ...resolveBlurhashString(blurhash),
      ...restSource,
    };
  }
  return source ?? null;
}

/**
 * Resolves provided `source` prop to an array of objects expected by the native implementation.
 */
export function resolveSources(sources?: ImageProps['source']): ImageNativeProps['source'] {
  if (Array.isArray(sources)) {
    return sources.map(resolveSource).filter(Boolean) as ImageSource[];
  }
  return [resolveSource(sources)].filter(Boolean) as ImageSource[];
}
