import { Platform, getConfig } from '@expo/config';

import { getPlatformBundlers } from '../../start/server/platformBundlers';
import { resolvePlatformOption } from '../resolveOptions';

export type Options = {
  platforms: Platform[];
  maxWorkers?: number;
  dev: boolean;
  clear: boolean;
};

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  const { exp } = getConfig(projectRoot, { skipPlugins: true, skipSDKVersionRequirement: true });
  const platformBundlers = getPlatformBundlers(projectRoot, exp);

  const platforms = resolvePlatformOption(exp, platformBundlers, args['--platform']);

  return {
    platforms,
    clear: !!args['--clear'],
    dev: !!args['--dev'],
    maxWorkers: args['--max-workers'],
  };
}
