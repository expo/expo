import resolveAssetSource from './resolveAssetSource';
import { AudioSource } from '../Audio.types';

export function resolveSource(source?: AudioSource | string | number | null): AudioSource | null {
  if (typeof source === 'string') {
    return { uri: source };
  }
  if (typeof source === 'number') {
    return resolveAssetSource(source);
  }
  return source ?? null;
}
