import { getOriginalEnv } from '@expo/env';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { exportEagerAsync } from '../../export/embed/exportEager';
import { Log } from '../../log';
import { hasRequiredAndroidFilesAsync } from '../../prebuild/clearNativeFolder';
import { assembleAsync, installAsync } from '../../start/platforms/android/gradle';
import { resolveBuildCache, uploadBuildCache } from '../../utils/build-cache-providers';
import { CommandError } from '../../utils/errors';
import { loadEnvFiles, type EnvironmentMode } from '../../utils/nodeEnv';
import { ensurePortAvailabilityAsync } from '../../utils/port';
import { getSchemesForAndroidAsync } from '../../utils/scheme';
import { ensureNativeProjectAsync } from '../ensureNativeProject';
import { event, debugEvent } from '../events';
import { logProjectLogsLocation } from '../hints';
import { startBundlerAsync } from '../startBundler';
import { resolveBuildModeAsync } from './resolveBuildModeAsync';
import { resolveInstallApkNameAsync } from './resolveInstallApkName';
import type { Options, ResolvedOptions } from './resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';

export async function runAndroidAsync(projectRoot: string, { install, ...options }: Options) {
  let variant = options.variant ?? 'debug';
  if (typeof variant !== 'string' || !variant) {
    throw new CommandError('BAD_ARGS', '--variant must be a non-empty string');
  }
  const originalEnv = getOriginalEnv();
  const hasNativeProject = await hasRequiredAndroidFilesAsync(projectRoot);
  let generationMode: EnvironmentMode | undefined;
  if (!options.binary && !hasNativeProject) {
    generationMode = variant.toLowerCase().endsWith('release') ? 'production' : 'development';
    process.env = { ...originalEnv, NODE_ENV: generationMode };
    loadEnvFiles(projectRoot, { mode: generationMode });
    await ensureNativeProjectAsync(projectRoot, { platform: 'android', install });
  }

  let mode: EnvironmentMode;
  if (options.binary) {
    mode = variant.toLowerCase().endsWith('release') ? 'production' : 'development';
  } else {
    ({ mode, variant } = await resolveBuildModeAsync(projectRoot, variant, originalEnv));
    if (generationMode && mode !== generationMode) {
      throw new CommandError(
        'ANDROID_BUILD_MODE',
        `Android variant '${variant}' uses ${mode} according to react.debuggableVariants, but Prebuild used ${generationMode}. Review the generated native configuration, then run again with the intended variant.`
      );
    }
  }
  options.variant = variant;
  const isProduction = mode === 'production';
  process.env = { ...originalEnv, NODE_ENV: mode };
  loadEnvFiles(projectRoot, {
    mode,
  });

  if (hasNativeProject || options.binary) {
    await ensureNativeProjectAsync(projectRoot, { platform: 'android', install });
  }

  const props = await resolveOptionsAsync(projectRoot, options);

  event('device:selected', {
    platform: 'android',
    name: props.device.device.name,
    id: props.device.device.pid ?? props.device.device.name,
    os: null,
    type: props.device.device.type,
  });

  if (!options.binary && props.buildCacheProvider) {
    const localPath = await resolveBuildCache({
      projectRoot,
      platform: 'android',
      provider: props.buildCacheProvider,
      runOptions: options,
    });
    if (localPath) {
      options.binary = localPath;
    }
  }

  debugEvent('android:package_name', { name: props.packageName });
  Log.log('› Building app...');

  const androidProjectRoot = path.join(projectRoot, 'android');

  let shouldUpdateBuildCache = false;
  if (!options.binary) {
    let eagerBundleOptions: string | undefined;

    if (isProduction) {
      eagerBundleOptions = JSON.stringify(
        await exportEagerAsync(projectRoot, {
          dev: false,
          platform: 'android',
        })
      );
    }

    const done = event.span();
    try {
      await assembleAsync(androidProjectRoot, {
        variant: props.variant,
        port: props.port,
        appName: props.appName,
        buildCache: props.buildCache,
        architectures: props.architectures,
        eagerBundleOptions,
      });
    } catch (error) {
      event('build:failed', { platform: 'android', error: event.error(error as Error) });
      throw error;
    }
    done('build:done', {
      platform: 'android',
      scheme: props.variant,
      configuration: props.variant,
      deviceId: props.device.device.pid ?? null,
    });
    shouldUpdateBuildCache = true;

    // Ensure the port hasn't become busy during the build.
    if (props.shouldStartBundler && !(await ensurePortAvailabilityAsync(projectRoot, props))) {
      props.shouldStartBundler = false;
    }
  }

  const manager = await startBundlerAsync(projectRoot, {
    port: props.port,
    mode,
    // If a scheme is specified then use that instead of the package name.
    scheme: (await getSchemesForAndroidAsync(projectRoot))?.[0],
    headless: !props.shouldStartBundler,
  });

  if (!options.binary) {
    // Find the APK file path
    const apkFile = await resolveInstallApkNameAsync(props.device.device, props);
    if (apkFile) {
      // Attempt to install the APK from the file path
      options.binary = path.join(props.apkVariantDirectory, apkFile);
    }
  }

  const doneInstall = event.span();
  if (options.binary) {
    // Attempt to install the APK from the file path
    const binaryPath = path.join(options.binary);

    if (!fs.existsSync(binaryPath)) {
      throw new CommandError(`The path to the custom Android binary does not exist: ${binaryPath}`);
    }
    Log.log(chalk.gray`\u203A Installing ${binaryPath}`);
    await props.device.installAppAsync(binaryPath);
  } else {
    await installAppAsync(androidProjectRoot, props);
  }
  doneInstall('install', { platform: 'android', appId: props.packageName });

  await manager.getDefaultDevServer().openCustomRuntimeAsync(
    'emulator',
    {
      applicationId: props.packageName,
      customAppId: props.customAppId,
      launchActivity: props.launchActivity,
    },
    { device: props.device.device }
  );

  event('launch', { platform: 'android', appId: props.packageName });

  if (props.shouldStartBundler) {
    logProjectLogsLocation();
  } else {
    await manager.stopAsync();
  }

  if (options.binary && shouldUpdateBuildCache && props.buildCacheProvider) {
    await uploadBuildCache({
      projectRoot,
      platform: 'android',
      provider: props.buildCacheProvider,
      buildPath: options.binary,
      runOptions: options,
    });
  }
}

async function installAppAsync(androidProjectRoot: string, props: ResolvedOptions) {
  // If we cannot resolve the APK file path then we can attempt to install using Gradle.
  // This offers more advanced resolution that we may not have first class support for.
  Log.log('› Failed to locate binary file, installing with Gradle...');
  await installAsync(androidProjectRoot, {
    variant: props.variant ?? 'debug',
    appName: props.appName ?? 'app',
    port: props.port,
  });
}
