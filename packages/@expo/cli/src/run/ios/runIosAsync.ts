import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import * as Log from '../../log';
import { AppleAppIdResolver } from '../../start/platforms/ios/AppleAppIdResolver';
import { maybePromptToSyncPodsAsync } from '../../utils/cocoapods';
import { setNodeEnv } from '../../utils/nodeEnv';
import { ensurePortAvailabilityAsync } from '../../utils/port';
import { profile } from '../../utils/profile';
import { getSchemesForIosAsync } from '../../utils/scheme';
import { ensureNativeProjectAsync } from '../ensureNativeProject';
import { logProjectLogsLocation } from '../hints';
import { startBundlerAsync } from '../startBundler';
import * as XcodeBuild from './XcodeBuild';
import { Options } from './XcodeBuild.types';
import { getLaunchInfoForBinaryAsync, launchAppAsync } from './launchApp';
import { resolveOptionsAsync } from './options/resolveOptions';
import { getValidBinaryPathAsync } from './validateExternalBinary';
import { exportEagerAsync } from '../../export/embed/exportEager';
import { getContainerPathAsync, simctlAsync } from '../../start/platforms/ios/simctl';
import { CommandError } from '../../utils/errors';

const debug = require('debug')('expo:run:ios');

export async function runIosAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.configuration === 'Release' ? 'production' : 'development');
  require('@expo/env').load(projectRoot);

  assertPlatform();

  const install = !!options.install;

  if ((await ensureNativeProjectAsync(projectRoot, { platform: 'ios', install })) && install) {
    await maybePromptToSyncPodsAsync(projectRoot);
  }

  // Resolve the CLI arguments into useable options.
  const props = await profile(resolveOptionsAsync)(projectRoot, options);

  if (options.rebundle) {
    Log.warn(`The --unstable-rebundle flag is experimental and may not work as expected.`);
    // Get the existing binary path to re-bundle the app.

    let binaryPath: string;
    if (!options.binary) {
      if (!props.isSimulator) {
        throw new Error('Re-bundling on physical devices requires the --binary flag.');
      }
      const appId = await new AppleAppIdResolver(projectRoot).getAppIdAsync();
      const possibleBinaryPath = await getContainerPathAsync(props.device, {
        appId,
      });
      if (!possibleBinaryPath) {
        throw new CommandError(
          `Cannot rebundle because no --binary was provided and no existing binary was found on the device for ID: ${appId}.`
        );
      }
      binaryPath = possibleBinaryPath;
      Log.log('Re-using existing binary path:', binaryPath);
      // Set the binary path to the existing binary path.
      options.binary = binaryPath;
    }

    Log.log('Rebundling the Expo config file');
    // Re-bundle the config file the same way the app was originally bundled.
    await spawnAsync('node', [
      path.join(require.resolve('expo-constants/package.json'), '../scripts/getAppConfig.js'),
      projectRoot,
      path.join(options.binary, 'EXConstants.bundle'),
    ]);
    // Re-bundle the app.

    const possibleBundleOutput = path.join(options.binary, 'main.jsbundle');

    if (fs.existsSync(possibleBundleOutput)) {
      Log.log('Rebundling the app...');
      await exportEagerAsync(projectRoot, {
        resetCache: false,
        dev: false,
        platform: 'ios',
        assetsDest: path.join(options.binary, 'assets'),
        bundleOutput: possibleBundleOutput,
      });
    } else {
      Log.warn('Bundle output not found at expected location:', possibleBundleOutput);
    }
  }

  let binaryPath: string;
  if (options.binary) {
    binaryPath = await getValidBinaryPathAsync(options.binary, props);
    Log.log('Using custom binary path:', binaryPath);
  } else {
    let eagerBundleOptions: string | undefined;

    if (options.configuration === 'Release') {
      eagerBundleOptions = JSON.stringify(
        await exportEagerAsync(projectRoot, {
          dev: false,
          platform: 'ios',
        })
      );
    }

    // Spawn the `xcodebuild` process to create the app binary.
    const buildOutput = await XcodeBuild.buildAsync({
      ...props,
      eagerBundleOptions,
    });

    // Find the path to the built app binary, this will be used to install the binary
    // on a device.
    binaryPath = await profile(XcodeBuild.getAppBinaryPath)(buildOutput);
  }
  debug('Binary path:', binaryPath);

  // Ensure the port hasn't become busy during the build.
  if (props.shouldStartBundler && !(await ensurePortAvailabilityAsync(projectRoot, props))) {
    props.shouldStartBundler = false;
  }

  const launchInfo = await getLaunchInfoForBinaryAsync(binaryPath);
  const isCustomBinary = !!options.binary;

  // Always close the app before launching on a simulator. Otherwise certain cached resources like the splashscreen will not be available.
  if (props.isSimulator) {
    try {
      await simctlAsync(['terminate', props.device.udid, launchInfo.bundleId]);
    } catch (error) {
      // If we failed it's likely that the app was not running to begin with and we will get an `invalid device` error
      debug('Failed to terminate app (possibly because it was not running):', error);
    }
  }

  // Start the dev server which creates all of the required info for
  // launching the app on a simulator.
  const manager = await startBundlerAsync(projectRoot, {
    port: props.port,
    headless: !props.shouldStartBundler,
    hostname: props.host,
    // If a scheme is specified then use that instead of the package name.

    scheme: isCustomBinary
      ? // If launching a custom binary, use the schemes in the Info.plist.
        launchInfo.schemes[0]
      : // If a scheme is specified then use that instead of the package name.
        (await getSchemesForIosAsync(projectRoot))?.[0],
  });

  // Install and launch the app binary on a device.
  await launchAppAsync(
    binaryPath,
    manager,
    {
      isSimulator: props.isSimulator,
      device: props.device,
      shouldStartBundler: props.shouldStartBundler,
    },
    launchInfo.bundleId
  );

  // Log the location of the JS logs for the device.
  if (props.shouldStartBundler) {
    logProjectLogsLocation();
  } else {
    await manager.stopAsync();
  }
}

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}
