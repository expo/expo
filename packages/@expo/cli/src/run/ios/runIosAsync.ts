import chalk from 'chalk';

import * as XcodeBuild from './XcodeBuild';
import { Options } from './XcodeBuild.types';
import { launchAppAsync } from './launchApp';
import { resolveOptionsAsync } from './options/resolveOptions';
import * as Log from '../../log';
import { maybePromptToSyncPodsAsync } from '../../utils/cocoapods';
import { setNodeEnv } from '../../utils/nodeEnv';
import { ensurePortAvailabilityAsync } from '../../utils/port';
import { profile } from '../../utils/profile';
import { getSchemesForIosAsync } from '../../utils/scheme';
import { ensureNativeProjectAsync } from '../ensureNativeProject';
import { logProjectLogsLocation } from '../hints';
import { startBundlerAsync } from '../startBundler';

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

  // Spawn the `xcodebuild` process to create the app binary.
  const buildOutput = await XcodeBuild.buildAsync(props);

  // Find the path to the built app binary, this will be used to install the binary
  // on a device.
  const binaryPath = await profile(XcodeBuild.getAppBinaryPath)(buildOutput);

  // Ensure the port hasn't become busy during the build.
  if (props.shouldStartBundler && !(await ensurePortAvailabilityAsync(projectRoot, props))) {
    props.shouldStartBundler = false;
  }

  // Start the dev server which creates all of the required info for
  // launching the app on a simulator.
  const manager = await startBundlerAsync(projectRoot, {
    port: props.port,
    headless: !props.shouldStartBundler,
    // If a scheme is specified then use that instead of the package name.
    scheme: (await getSchemesForIosAsync(projectRoot))?.[0],
  });

  // Install and launch the app binary on a device.
  await launchAppAsync(binaryPath, manager, {
    isSimulator: props.isSimulator,
    device: props.device,
    shouldStartBundler: props.shouldStartBundler,
  });

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
