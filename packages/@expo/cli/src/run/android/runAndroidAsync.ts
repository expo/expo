import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { resolveInstallApkNameAsync } from './resolveInstallApkName';
import { Options, ResolvedOptions, resolveOptionsAsync } from './resolveOptions';
import { exportEagerAsync } from '../../export/embed/exportEager';
import { Log } from '../../log';
import type { AndroidOpenInCustomProps } from '../../start/platforms/android/AndroidPlatformManager';
import { assembleAsync, installAsync } from '../../start/platforms/android/gradle';
import { CommandError } from '../../utils/errors';
import { setNodeEnv } from '../../utils/nodeEnv';
import { ensurePortAvailabilityAsync } from '../../utils/port';
import { getSchemesForAndroidAsync } from '../../utils/scheme';
import { ensureNativeProjectAsync } from '../ensureNativeProject';
import { logProjectLogsLocation } from '../hints';
import { startBundlerAsync } from '../startBundler';

const debug = require('debug')('expo:run:android');

export async function runAndroidAsync(projectRoot: string, { install, ...options }: Options) {
  // NOTE: This is a guess, the developer can overwrite with `NODE_ENV`.
  const isProduction = options.variant?.toLowerCase().endsWith('release');
  setNodeEnv(isProduction ? 'production' : 'development');
  require('@expo/env').load(projectRoot);

  await ensureNativeProjectAsync(projectRoot, { platform: 'android', install });

  const props = await resolveOptionsAsync(projectRoot, options);

  debug('Package name: ' + props.packageName);
  Log.log('› Building app...');

  const androidProjectRoot = path.join(projectRoot, 'android');

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

    await assembleAsync(androidProjectRoot, {
      variant: props.variant,
      port: props.port,
      appName: props.appName,
      buildCache: props.buildCache,
      architectures: props.architectures,
      eagerBundleOptions,
    });

    // Ensure the port hasn't become busy during the build.
    if (props.shouldStartBundler && !(await ensurePortAvailabilityAsync(projectRoot, props))) {
      props.shouldStartBundler = false;
    }
  }

  const manager = await startBundlerAsync(projectRoot, {
    port: props.port,
    // If a scheme is specified then use that instead of the package name.
    scheme: (await getSchemesForAndroidAsync(projectRoot))?.[0],
    headless: !props.shouldStartBundler,
  });

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

  await manager.getDefaultDevServer().openCustomRuntimeAsync<AndroidOpenInCustomProps>(
    'emulator',
    {
      applicationId: props.packageName,
      customAppId: props.customAppId,
      launchActivity: props.launchActivity,
    },
    { device: props.device.device }
  );

  if (props.shouldStartBundler) {
    logProjectLogsLocation();
  } else {
    await manager.stopAsync();
  }
}

async function installAppAsync(androidProjectRoot: string, props: ResolvedOptions) {
  // Find the APK file path
  const apkFile = await resolveInstallApkNameAsync(props.device.device, props);

  if (apkFile) {
    // Attempt to install the APK from the file path
    const binaryPath = path.join(props.apkVariantDirectory, apkFile);
    Log.log(chalk.gray`\u203A Installing ${binaryPath}`);
    await props.device.installAppAsync(binaryPath);
  } else {
    // If we cannot resolve the APK file path then we can attempt to install using Gradle.
    // This offers more advanced resolution that we may not have first class support for.
    Log.log('› Failed to locate binary file, installing with Gradle...');
    await installAsync(androidProjectRoot, {
      variant: props.variant ?? 'debug',
      appName: props.appName ?? 'app',
      port: props.port,
    });
  }
}
