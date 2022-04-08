import { getConfig } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import * as Log from '../../log';
import { promptToClearMalformedNativeProjectsAsync } from '../../prebuild/clearNativeFolder';
import { prebuildAsync } from '../../prebuild/prebuildAsync';
import { AppleDeviceManager } from '../../start/platforms/ios/AppleDeviceManager';
import { SimulatorLogStreamer } from '../../start/platforms/ios/simctlLogging';
import { maybePromptToSyncPodsAsync } from '../../utils/cocoapods';
import { CI } from '../../utils/env';
import { parsePlistAsync } from '../../utils/plist';
import { profile } from '../../utils/profile';
import * as XcodeBuild from './XcodeBuild';
import { Options } from './XcodeBuild.types';
import { getAppDeltaDirectory, installOnDeviceAsync } from './appleDevice/installOnDeviceAsync';
import { resolveOptionsAsync } from './options/resolveOptionsAsync';
import { startBundlerAsync } from './startBundlerAsync';

export async function runIosAsync(projectRoot: string, options: Options) {
  assertPlatform();

  // If the user has an empty ios folder then the project won't build, this can happen when they delete the prebuild files in git.
  // Check to ensure most of the core files are in place, and prompt to remove the folder if they aren't.
  await profile(promptToClearMalformedNativeProjectsAsync)(projectRoot, ['ios']);

  const { exp } = getConfig(projectRoot);

  await ensureNativeProjectAsync(projectRoot, options.install);

  const props = await resolveOptionsAsync(projectRoot, options);

  const buildOutput = await profile(XcodeBuild.buildAsync, 'XcodeBuild.buildAsync')(props);

  const binaryPath = await profile(
    XcodeBuild.getAppBinaryPath,
    'XcodeBuild.getAppBinaryPath'
  )(buildOutput);

  const manager = await startBundlerAsync(projectRoot, {
    port: props.port,
    headless: !props.shouldStartBundler,
    platforms: exp.platforms ?? [],
  });

  const appId = await profile(getBundleIdentifierForBinaryAsync)(binaryPath);

  if (props.isSimulator) {
    XcodeBuild.logPrettyItem(chalk`{bold Installing} on ${props.device.name}`);

    const device = await AppleDeviceManager.resolveAsync({ device: props.device });
    await device.installAppAsync(binaryPath);

    XcodeBuild.logPrettyItem(chalk`{bold Opening} on ${device.name} {dim (${appId})}`);

    if (props.shouldStartBundler) {
      await SimulatorLogStreamer.getStreamer(device.device, {
        appId,
      }).attachAsync();
    }

    await manager
      .getDefaultDevServer()
      .openCustomRuntimeAsync('simulator', { applicationId: appId }, { device });
  } else {
    await profile(installOnDeviceAsync)({
      bundleIdentifier: appId,
      bundle: binaryPath,
      appDeltaDirectory: getAppDeltaDirectory(appId),
      udid: props.device.udid,
      deviceName: props.device.name,
    });
  }

  if (props.shouldStartBundler) {
    Log.log(
      chalk`Logs for your project will appear below.${
        CI ? '' : chalk.dim(` Press Ctrl+C to exit.`)
      }`
    );
  }
}

async function getBundleIdentifierForBinaryAsync(binaryPath: string): Promise<string> {
  const builtInfoPlistPath = path.join(binaryPath, 'Info.plist');
  const { CFBundleIdentifier } = await parsePlistAsync(builtInfoPlistPath);
  return CFBundleIdentifier;
}

async function ensureNativeProjectAsync(projectRoot: string, install?: boolean) {
  // If the project doesn't have native code, prebuild it...
  if (!fs.existsSync(path.join(projectRoot, 'ios'))) {
    await prebuildAsync(projectRoot, {
      install: !!install,
      platforms: ['ios'],
    });
  } else if (install) {
    await maybePromptToSyncPodsAsync(projectRoot);
    // TODO: Ensure the pods are in sync -- https://github.com/expo/expo/pull/11593
  }
}

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}
