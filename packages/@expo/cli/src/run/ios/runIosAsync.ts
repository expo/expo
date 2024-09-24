import { resolveEntryPoint } from '@expo/config/paths';
import chalk from 'chalk';
import os from 'os';
import path from 'path';

import * as Log from '../../log';
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
import { prebundleAppAsync } from './prebundleIos';
import { getValidBinaryPathAsync } from './validateExternalBinary';

const debug = require('debug')('expo:run:ios');

function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

export async function runIosAsync(projectRoot: string, options: Options) {
  setNodeEnv(options.configuration === 'Release' ? 'production' : 'development');
  require('@expo/env').load(projectRoot);

  assertPlatform();

  const install = !!options.install;

  if ((await ensureNativeProjectAsync(projectRoot, { platform: 'ios', install })) && install) {
    await maybePromptToSyncPodsAsync(projectRoot);
  }

  // Resolve the CLI arguments into useable options.
  const props = await resolveOptionsAsync(projectRoot, options);

  const isCustomBinary = !!options.binary;

  let prebundleData: string | undefined;
  const needsBundling =
    !isCustomBinary && (options.configuration !== 'Debug' || !props.isSimulator);
  if (needsBundling) {
    const tempDir: string = getTemporaryPath();
    // Prebundle the app
    debug('Bundling JS before building: ' + tempDir);
    prebundleData = JSON.stringify(
      await prebundleAppAsync(projectRoot, {
        resetCache: false,
        dev: options.configuration === 'Debug',
        destination: tempDir,
        entryFile: resolveEntryPoint(projectRoot, { platform: 'ios' }),
      })
    );
    debug('JS bundling complete');
  }

  let binaryPath: string;
  if (options.binary) {
    binaryPath = await getValidBinaryPathAsync(options.binary, props);
    Log.log('Using custom binary path:', binaryPath);
  } else {
    // Spawn the `xcodebuild` process to create the app binary.
    const buildOutput = await XcodeBuild.buildAsync({
      ...props,
      prebundleOutput: prebundleData,
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

  // Start the dev server which creates all of the required info for
  // launching the app on a simulator.
  const manager = await startBundlerAsync(projectRoot, {
    port: props.port,
    headless: !props.shouldStartBundler,
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
