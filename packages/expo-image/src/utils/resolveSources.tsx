import { Platform } from 'expo-modules-core';

import resolveAssetSource from './resolveAssetSource';
import { resolveBlurhashString, resolveThumbhashString } from './resolveHashString';
import { ImageNativeProps, ImageProps, ImageSource } from '../Image.types';
import { isImageRef } from '../utils';

export function isBlurhashString(str: string): boolean {
  return /^(blurhash:\/)+[\w#$%*+,\-.:;=?@[\]^_{}|~]+(\/[\d.]+)*$/.test(str);
}

// Base64 strings will be recognized as blurhash by default (to keep compatibility),
// interpret as thumbhash only if correct uri scheme is provided
export function isThumbhashString(str: string): boolean {
  return str.startsWith('thumbhash:/');
}

// SF Symbols are specified with the sf: prefix, e.g. "sf:star" or "sf:star.fill"
export function isSFSymbolString(str: string): boolean {
  return str.startsWith('sf:');
}

export function resolveSFSymbolString(str: string): ImageSource {
  // Extract the symbol name after "sf:" prefix
  const symbolName = str.slice(3);
  return { uri: `sf:/${symbolName}` };
}

export function resolveSource(source?: ImageSource | string | number | null): ImageSource | null {
  if (typeof source === 'string') {
    if (isBlurhashString(source)) {
      return resolveBlurhashString(source);
    } else if (isThumbhashString(source)) {
      return resolveThumbhashString(source);
    } else if (isSFSymbolString(source)) {
      return resolveSFSymbolString(source);
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
  if (isImageRef(sources)) {
    if (Platform.OS === 'web') {
      return sources;
    }
    // @ts-expect-error
    return sources.__expo_shared_object_id__;
  }
  return [resolveSource(sources)].filter(Boolean) as ImageSource[];
}
