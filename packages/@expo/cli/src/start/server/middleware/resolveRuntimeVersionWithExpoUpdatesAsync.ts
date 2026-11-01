import type { HashSource } from '@expo/fingerprint';

import { env } from '../../../utils/env';
import {
  ExpoUpdatesCLIModuleNotFoundError,
  expoUpdatesCommandAsync,
} from '../../../utils/expoUpdatesCli';
import { manifestDebugEvent } from './events';
import type { RuntimePlatform } from './resolvePlatform';

/** Output of `expo-updates runtimeversion:resolve`. */
export interface ExpoUpdatesRuntimeVersionResult {
  runtimeVersion: string | null;
  /** The sources hashed into the fingerprint, or `null` when the runtime version policy isn't `fingerprint`. */
  fingerprintSources: HashSource[] | null;
  workflow: 'managed' | 'generic';
}

/**
 * Resolve the runtime version with the project's expo-updates.
 * Returns `null` when expo-updates isn't installed.
 */
export async function resolveRuntimeVersionWithExpoUpdatesAsync({
  projectRoot,
  platform,
}: {
  projectRoot: string;
  platform: RuntimePlatform;
}): Promise<ExpoUpdatesRuntimeVersionResult | null> {
  try {
    const extraArgs = env.EXPO_DEBUG ? ['--debug'] : [];
    const resolvedRuntimeVersionJSONResult = await expoUpdatesCommandAsync(projectRoot, [
      'runtimeversion:resolve',
      '--platform',
      platform,
      ...extraArgs,
    ]);
    const runtimeVersionResult: Partial<ExpoUpdatesRuntimeVersionResult> = JSON.parse(
      resolvedRuntimeVersionJSONResult
    );
    manifestDebugEvent('runtime_version_resolved', { result: resolvedRuntimeVersionJSONResult });

    return {
      runtimeVersion: runtimeVersionResult.runtimeVersion ?? null,
      fingerprintSources: runtimeVersionResult.fingerprintSources ?? null,
      workflow: runtimeVersionResult.workflow ?? 'generic',
    };
  } catch (e: any) {
    if (e instanceof ExpoUpdatesCLIModuleNotFoundError) {
      return null;
    }
    throw e;
  }
}
