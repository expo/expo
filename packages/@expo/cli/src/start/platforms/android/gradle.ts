import type { SpawnResult } from '@expo/spawn-async';
import spawnAsync from '@expo/spawn-async';
import path from 'path';

import { AbortCommandError } from '../../../utils/errors';
import { event } from '../events';

export function formatGradleInstallArguments({
  appName,
  variant,
}: {
  variant: string;
  appName: string;
}): string[] {
  const task = `install${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  return [appName ? `${appName}:${task}` : task];
}

function resolveGradleWPath(androidProjectPath: string): string {
  return path.join(androidProjectPath, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
}

function getPortArg(port: number): string {
  return `-PreactNativeDevServerPort=${port}`;
}

/**
 * Install an app on device or emulator using `gradlew install`.
 *
 * @param androidProjectPath - Path to the Android project like `projectRoot/android`.
 * @param props.variant - Variant to install.
 * @param props.appName - Name of the 'app' folder, this appears to always be `app`.
 * @param props.port - Dev server port to pass to the install command.
 * @returns - A promise resolving to spawn results.
 */
export async function installAsync(
  androidProjectPath: string,
  {
    variant,
    appName,
    port,
    deviceId,
    architectures,
    eagerBundleOptions,
  }: {
    variant: string;
    appName: string;
    port?: number;
    deviceId: string;
    architectures?: string;
    eagerBundleOptions?: string;
  }
): Promise<SpawnResult> {
  const args = formatGradleInstallArguments({ variant, appName });
  if (architectures) args.push(`-PreactNativeArchitectures=${architectures}`);
  return await spawnGradleAsync(androidProjectPath, {
    port,
    args,
    env: {
      ...process.env,
      ANDROID_SERIAL: deviceId,
      ...(eagerBundleOptions ? { __EXPO_EAGER_BUNDLE_OPTIONS: eagerBundleOptions } : {}),
    },
  });
}

export async function spawnGradleAsync(
  projectRoot: string,
  { port, args, env = process.env }: { port?: number; args: string[]; env?: NodeJS.ProcessEnv }
): Promise<SpawnResult> {
  const gradlew = resolveGradleWPath(projectRoot);
  if (port != null) args.push(getPortArg(port));
  event('gradle_spawn', { command: `${gradlew} ${args.join(' ')}` });
  try {
    return await spawnAsync(gradlew, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env,
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      (('status' in error && error.status === 130) ||
        ('signal' in error && error.signal === 'SIGINT'))
    ) {
      throw new AbortCommandError();
    }
    throw error;
  }
}
