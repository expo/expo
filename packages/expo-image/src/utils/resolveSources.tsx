import resolveAssetSource from './resolveAssetSource';
import { resolveBlurhashString, resolveThumbhashString } from './resolveHashString';
import { ImageNativeProps, ImageProps, ImageSource } from '../Image.types';

export function isBlurhashString(str: string): boolean {
  return /^(blurhash:\/)+[\w#$%*+,\-.:;=?@[\]^_{}|~]+(\/[\d.]+)*$/.test(str);
}

// Base64 strings will be recognized as blurhash by default (to keep compatibility),
// interpret as thumbhash only if correct uri scheme is provided
export function isThumbhashString(str: string): boolean {
  return str.startsWith('thumbhash:/');
}

function resolveSource(source?: ImageSource | string | number | null): ImageSource | null {
  if (typeof source === 'string') {
    if (isBlurhashString(source)) {
      return resolveBlurhashString(source);
    } else if (isThumbhashString(source)) {
      return resolveThumbhashString(source);
    }
    return { uri: source };
  }
  if (typeof source === 'number') {
    return resolveAssetSource(source);
  }
  if (typeof source === 'object' && (source?.blurhash || source?.thumbhash)) {
    const { blurhash, thumbhash, ...restSource } = source;
    const resolved = thumbhash
      ? resolveThumbhashString(thumbhash)
      : resolveBlurhashString(blurhash as string);
    return {
      ...resolved,
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
