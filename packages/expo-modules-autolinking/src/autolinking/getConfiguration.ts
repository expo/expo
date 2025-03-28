import type { ResolveOptions } from '../types';
import { getLinkingImplementationForPlatform } from './utils';

export function getConfiguration(options: ResolveOptions) {
  const platformLinking = getLinkingImplementationForPlatform(options.platform);
  return platformLinking.getConfiguration?.(options);
}
