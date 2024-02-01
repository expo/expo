import spawnAsync, { SpawnResult } from '@expo/spawn-async';
import path from 'path';

import { env } from '../../../utils/env';
import { AbortCommandError } from '../../../utils/errors';

const debug = require('debug')('expo:start:platforms:android:gradle') as typeof console.log;

function upperFirst(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Format gradle assemble arguments. Exposed for testing.  */
export function formatGradleArguments(
  cmd: 'assemble' | 'install',
  {
    appName,
    variant,
    tasks = [cmd + upperFirst(variant)],
  }: { tasks?: string[]; variant: string; appName: string }
): string[] {
  return appName ? tasks.map((task) => `${appName}:${task}`) : tasks;
}

function resolveGradleWPath(androidProjectPath: string): string {
  return path.join(androidProjectPath, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
}

function getPortArg(port: number): string {
  return `-PreactNativeDevServerPort=${port}`;
}

function getActiveArchArg(architectures: string): string {
  return `-PreactNativeArchitectures=${architectures}`;
}

/**
 * Build the Android project using Gradle.
 *
 * @param androidProjectPath - Path to the Android project like `projectRoot/android`.
 * @param props.variant - Variant to install.
 * @param props.appName - Name of the 'app' folder, this appears to always be `app`.
 * @param props.port - Dev server port to pass to the install command.
 * @param props.buildCache - Should use the `--build-cache` flag, enabling the [Gradle build cache](https://docs.gradle.org/current/userguide/build_cache.html).
 * @param props.architectures - Architectures to build for.
 * @returns - A promise resolving to spawn results.
 */
export async function assembleAsync(
  androidProjectPath: string,
  {
    variant,
    port,
    appName,
    buildCache,
    architectures,
  }: {
    variant: string;
    port?: number;
    appName: string;
    buildCache?: boolean;
    architectures?: string;
  }
): Promise<SpawnResult> {
  const task = formatGradleArguments('assemble', { variant, appName });
  const args = [
    ...task,
    // ignore linting errors
    '-x',
    'lint',
    // ignore tests
    '-x',
    'test',
    '--configure-on-demand',
  ];

  if (buildCache) args.push('--build-cache');

  // Generate a profile under `/android/app/build/reports/profile`
  if (env.EXPO_PROFILE) args.push('--profile');

  return await spawnGradleAsync(androidProjectPath, { port, architectures, args });
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
  }: {
    variant: string;
    appName: string;
    port?: number;
  }
): Promise<SpawnResult> {
  const args = formatGradleArguments('install', { variant, appName });
  return await spawnGradleAsync(androidProjectPath, { port, args });
}

export async function spawnGradleAsync(
  projectRoot: string,
  { port, architectures, args }: { port?: number; architectures?: string; args: string[] }
): Promise<SpawnResult> {
  const gradlew = resolveGradleWPath(projectRoot);
  if (port != null) args.push(getPortArg(port));
  if (architectures) args.push(getActiveArchArg(architectures));
  debug(`  ${gradlew} ${args.join(' ')}`);
  try {
    return await spawnAsync(gradlew, args, {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  } catch (error: any) {
    // User aborted the command with ctrl-c
    if (error.status === 130) {
      // Fail silently
      throw new AbortCommandError();
    }
    throw error;
  }
}
