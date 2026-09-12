import type { EnvMode } from '@expo/env';

import { env } from '../../../utils/env';
import {
  ExpoUpdatesCLIModuleNotFoundError,
  expoUpdatesCommandAsync,
} from '../../../utils/expoUpdatesCli';
import { manifestDebugEvent } from './events';
import type { RuntimePlatform } from './resolvePlatform';

export async function resolveRuntimeVersionWithExpoUpdatesAsync({
  projectRoot,
  platform,
  mode,
}: {
  projectRoot: string;
  platform: RuntimePlatform;
  mode: EnvMode;
}): Promise<string | null> {
  try {
    const extraArgs = env.EXPO_DEBUG ? ['--debug'] : [];
    const resolvedRuntimeVersionJSONResult = await expoUpdatesCommandAsync(
      projectRoot,
      ['runtimeversion:resolve', '--platform', platform, ...extraArgs],
      mode
    );
    const runtimeVersionResult: { runtimeVersion: string | null } = JSON.parse(
      resolvedRuntimeVersionJSONResult
    );
    manifestDebugEvent('runtime_version_resolved', { result: resolvedRuntimeVersionJSONResult });

    return runtimeVersionResult.runtimeVersion ?? null;
  } catch (e: any) {
    if (e instanceof ExpoUpdatesCLIModuleNotFoundError) {
      return null;
    }
    throw e;
  }
}
