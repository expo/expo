import { AutolinkingOptions } from '../commands/autolinkingOptions';
import type { SupportedPlatform } from '../types';
import { getLinkingImplementationForPlatform } from './utils';

interface GetConfigurationParams {
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform };
}

export function getConfiguration({ autolinkingOptions }: GetConfigurationParams) {
  const platformLinking = getLinkingImplementationForPlatform(autolinkingOptions.platform);
  // TODO(@kitten): Unclear what's needed here due to lack of types
  return platformLinking.getConfiguration?.(autolinkingOptions);
}
