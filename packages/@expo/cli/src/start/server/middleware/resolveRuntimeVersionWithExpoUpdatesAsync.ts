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
}: {
  projectRoot: string;
  platform: RuntimePlatform;
}): Promise<string | null> {
  try {
    const extraArgs = env.EXPO_DEBUG ? ['--debug'] : [];
    const resolvedRuntimeVersionJSONResult = await expoUpdatesCommandAsync(projectRoot, [
      'runtimeversion:resolve',
      '--platform',
      platform,
      ...extraArgs,
    ]);
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
