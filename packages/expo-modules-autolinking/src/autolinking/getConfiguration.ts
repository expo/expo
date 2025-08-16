import { AutolinkingOptions } from '../commands/autolinkingOptions';
import { getLinkingImplementationForPlatform } from '../platforms';
import type { SupportedPlatform } from '../types';

interface GetConfigurationParams {
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform };
}

export function getConfiguration({
  autolinkingOptions,
}: GetConfigurationParams): Record<string, any> | undefined {
  const platformLinking = getLinkingImplementationForPlatform(autolinkingOptions.platform);
  if ('getConfiguration' in platformLinking) {
    return platformLinking.getConfiguration(autolinkingOptions);
  } else {
    return undefined;
  }
}
