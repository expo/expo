import spawnAsync from '@expo/spawn-async';
import type { ProcessRunner } from '@ramonclaudio/compile';
import { buildAndroid, CompileError } from '@ramonclaudio/compile';
import path from 'path';

import { event } from '../../start/platforms/events';
import { env } from '../../utils/env';
import { AbortCommandError, CommandError } from '../../utils/errors';

export async function compileAndroidAsync(
  androidProjectRoot: string,
  {
    variant,
    appName,
    port,
    buildCache,
    architectures,
    eagerBundleOptions,
  }: {
    variant: string;
    appName: string;
    port?: number;
    buildCache?: boolean;
    architectures?: string;
    eagerBundleOptions?: string;
  }
): Promise<readonly string[]> {
  const gradleArgs = ['-x', 'lint', '-x', 'test', '--configure-on-demand'];
  if (buildCache) gradleArgs.push('--build-cache');
  if (env.EXPO_PROFILE) gradleArgs.push('--profile');
  if (port != null) gradleArgs.push(`-PreactNativeDevServerPort=${port}`);
  if (architectures) gradleArgs.push(`-PreactNativeArchitectures=${architectures}`);

  try {
    return await buildAndroid(
      {
        wrapper: {
          cwd: androidProjectRoot,
          path: path.join(
            androidProjectRoot,
            process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'
          ),
        },
        modulePath: appName ? `:${appName.replace(/^:/, '')}` : ':',
        variant,
        outputType: 'apk',
        gradleArgs,
      },
      {
        runProcess: runGradleAsync,
        env: {
          ...process.env,
          ...(eagerBundleOptions ? { __EXPO_EAGER_BUNDLE_OPTIONS: eagerBundleOptions } : {}),
        },
      }
    );
  } catch (error) {
    if (!(error instanceof CompileError)) throw error;
    if (error.signal === 'SIGINT' || error.exitCode === 130) throw new AbortCommandError();
    throw new CommandError('ANDROID_BUILD_FAILED', error.message);
  }
}

const runGradleAsync: ProcessRunner = async (command, args, options) => {
  event('gradle_spawn', { command: `${command} ${args.join(' ')}` });
  try {
    const result = await spawnAsync(command, args, {
      cwd: options.cwd,
      env: options.env,
      signal: options.signal,
      stdio: options.outputMode === 'stderr' ? 'inherit' : 'pipe',
    });
    return { status: 'exited', exitCode: 0, stdout: result.stdout, stderr: result.stderr };
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
};
