import chalk from 'chalk';

import * as XcodeBuild from './XcodeBuild';
import { Options } from './XcodeBuild.types';
import { getLaunchInfoForBinaryAsync, launchAppAsync } from './launchApp';
import { resolveOptionsAsync } from './options/resolveOptions';
import { getValidBinaryPathAsync } from './validateExternalBinary';
import * as Log from '../../log';
import { maybePromptToSyncPodsAsync } from '../../utils/cocoapods';
import { setNodeEnv } from '../../utils/nodeEnv';
import { ensurePortAvailabilityAsync } from '../../utils/port';
import { profile } from '../../utils/profile';
import { getSchemesForAppleAsync } from '../../utils/scheme';
import { ensureNativeProjectAsync } from '../ensureNativeProject';
import { logProjectLogsLocation } from '../hints';
import { startBundlerAsync } from '../startBundler';

const debug = require('debug')('expo:run:apple');

export const runAppleAsync =
  (applePlatform: 'ios' | 'macos') => async (projectRoot: string, options: Options) => {
    setNodeEnv(options.configuration === 'Release' ? 'production' : 'development');
    require('@expo/env').load(projectRoot);

    assertPlatform();

    const install = !!options.install;

    if (
      (await ensureNativeProjectAsync(projectRoot, { platform: applePlatform, install })) &&
      install
    ) {
      await maybePromptToSyncPodsAsync(applePlatform)(projectRoot);
    }

    // Resolve the CLI arguments into useable options.
    const props = await resolveOptionsAsync(projectRoot, options);

    let binaryPath: string;
    if (options.binary) {
      binaryPath = await getValidBinaryPathAsync(options.binary, props);
      Log.log('Using custom binary path:', binaryPath);
    } else {
      // Spawn the `xcodebuild` process to create the app binary.
      const buildOutput = await XcodeBuild.buildAsync(props);

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
    // Start the dev server which creates all of the required info for
    // launching the app on a simulator.
    const manager = await startBundlerAsync(projectRoot, {
      port: props.port,
      headless: !props.shouldStartBundler,

      scheme: isCustomBinary
        ? // If launching a custom binary, use the schemes in the Info.plist.
          launchInfo.schemes[0]
        : // If a scheme is specified then use that instead of the package name.
          (await getSchemesForAppleAsync(applePlatform)(projectRoot))?.[0],
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
  };

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`Apple apps can only be built on macOS devices. Use {cyan eas build -p ios} or {cyan eas build -p macos} to build in the cloud.`
    );
  }
}
