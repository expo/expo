import { compileAndroid, compileIos } from '@ramonclaudio/compile';
import fs from 'node:fs';

import { CommandError } from '../utils/errors';
import { loadEnvFiles } from '../utils/nodeEnv';
import type { CompileCommandRequest } from './args';
import { resolveAndroidDeviceAsync } from './resolveAndroidDevice';

export async function compileAsync(request: CompileCommandRequest): Promise<readonly string[]> {
  if (request.platform === 'ios' && process.platform !== 'darwin') {
    throw new CommandError('UNSUPPORTED_PLATFORM', 'iOS compilation requires macOS and Xcode.');
  }

  if (!fs.statSync(request.cwd, { throwIfNoEntry: false })?.isDirectory()) {
    throw new CommandError('BAD_ARGS', `Invalid project directory: ${request.cwd}`);
  }

  loadEnvFiles(request.cwd, { mode: request.mode, silent: true });

  if (request.platform === 'android') {
    const { device, ...nativeRequest } = request;
    if (device === undefined) {
      return compileAndroid(nativeRequest, { outputMode: 'quiet' });
    }
    const architectures = await resolveAndroidDeviceAsync(device);
    return compileAndroid(
      { ...nativeRequest, expectedArchitectures: architectures },
      {
        outputMode: 'quiet',
        env: {
          ...process.env,
          GRADLE_OPTS: [
            process.env.GRADLE_OPTS,
            `-Dorg.gradle.project.android.injected.build.abi=${architectures.join(',')}`,
            // React Native configures APK packaging separately from AGP's build ABI.
            `-Dorg.gradle.project.reactNativeArchitectures=${architectures.join(',')}`,
          ]
            .filter(Boolean)
            .join(' '),
        },
      }
    );
  }
  return compileIos(request, {
    outputMode: 'quiet',
    env: { ...process.env, RCT_NO_LAUNCH_PACKAGER: 'true' },
  });
}
