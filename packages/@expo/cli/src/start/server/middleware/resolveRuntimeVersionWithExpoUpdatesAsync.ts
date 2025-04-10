import { RuntimePlatform } from './resolvePlatform';
import { env } from '../../../utils/env';
import {
  ExpoUpdatesCLIModuleNotFoundError,
  expoUpdatesCommandAsync,
} from '../../../utils/expoUpdatesCli';

const debug = require('debug')('expo:start:server:middleware:resolveRuntimeVersion');

export async function resolveRuntimeVersionWithExpoUpdatesAsync({
  projectRoot,
  platform,
}: {
  projectRoot: string;
  platform: RuntimePlatform;
}): Promise<string | null> {
  try {
    debug('Using expo-updates runtimeversion:resolve CLI for runtime version resolution');
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
    debug('runtimeversion:resolve output:');
    debug(resolvedRuntimeVersionJSONResult);

    return runtimeVersionResult.runtimeVersion ?? null;
  } catch (e: any) {
    if (e instanceof ExpoUpdatesCLIModuleNotFoundError) {
      return null;
    }
    throw e;
  }
}
