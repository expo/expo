import { getConfig } from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import * as path from 'path';

import * as Log from '../../log';
import { promptToClearMalformedNativeProjectsAsync } from '../../prebuild/clearNativeFolder';
import { prebuildAsync } from '../../prebuild/prebuildAsync';
import { AppleDeviceManager } from '../../start/platforms/ios/AppleDeviceManager';
import { ApplePlatformManager } from '../../start/platforms/ios/ApplePlatformManager';
import { SimulatorLogStreamer } from '../../start/platforms/ios/simctlLogging';
import { parsePlistAsync } from '../../utils/plist';
import { profile } from '../../utils/profile';
import { getAppDeltaDirectory, installOnDeviceAsync } from './installOnDeviceAsync';
import * as IOSDeploy from './IOSDeploy';
import maybePromptToSyncPodsAsync from './Podfile';
import { Options, resolveOptionsAsync } from './resolveOptionsAsync';
import { startBundlerAsync } from './startBundlerAsync';
import * as XcodeBuild from './XcodeBuild';

const isMac = process.platform === 'darwin';

export async function runIosAsync(projectRoot: string, options: Options) {
  // If the user has an empty ios folder then the project won't build, this can happen when they delete the prebuild files in git.
  // Check to ensure most of the core files are in place, and prompt to remove the folder if they aren't.
  await profile(promptToClearMalformedNativeProjectsAsync)(projectRoot, ['ios']);

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  if (!isMac) {
    // TODO: Prompt to use EAS?

    Log.warn(
      `iOS apps can only be built on macOS devices. Use ${chalk.cyan`eas build -p ios`} to build in the cloud.`
    );
    return;
  }

  // If the project doesn't have native code, prebuild it...
  if (!fs.existsSync(path.join(projectRoot, 'ios'))) {
    await prebuildAsync(projectRoot, {
      install: options.install,
      platforms: ['ios'],
    });
  } else if (options.install) {
    await maybePromptToSyncPodsAsync(projectRoot);
    // TODO: Ensure the pods are in sync -- https://github.com/expo/expo/pull/11593
  }

  const props = await resolveOptionsAsync(projectRoot, options);
  if (!props.isSimulator) {
    // TODO: Replace with JS...
    // Assert as early as possible
    await IOSDeploy.assertInstalledAsync();
  }

  const buildOutput = await profile(XcodeBuild.buildAsync, 'XcodeBuild.buildAsync')(props);

  const binaryPath = await profile(
    XcodeBuild.getAppBinaryPath,
    'XcodeBuild.getAppBinaryPath'
  )(buildOutput);

  if (props.shouldStartBundler) {
    await startBundlerAsync(projectRoot, {
      metroPort: props.port,
      platforms: exp.platforms,
    });
  }
  const bundleIdentifier = await profile(getBundleIdentifierForBinaryAsync)(binaryPath);

  if (props.isSimulator) {
    XcodeBuild.logPrettyItem(chalk`{bold Installing} on ${props.device.name}`);

    const device = await AppleDeviceManager.resolveAsync({ device: props.device });
    await device.installAppAsync(binaryPath);

    XcodeBuild.logPrettyItem(chalk`{bold Opening} on ${device.name} {dim (${bundleIdentifier})}`);

    if (props.shouldStartBundler) {
      await SimulatorLogStreamer.getStreamer(device.device, {
        appId: bundleIdentifier,
      }).attachAsync();
    }

    const platform = new ApplePlatformManager(projectRoot, props.port, {
      // TODO:...
    });

    await platform.openAsync(
      {
        runtime: 'custom',
        props: {
          applicationId: bundleIdentifier,
          scheme: props.scheme,
        },
      },
      {
        // TODO: Reduce resolving
        device: device.device,
      }
    );
  } else {
    await profile(installOnDeviceAsync)({
      bundleIdentifier,
      bundle: binaryPath,
      appDeltaDirectory: getAppDeltaDirectory(bundleIdentifier),
      udid: props.device.udid,
      deviceName: props.device.name,
    });
  }

  if (props.shouldStartBundler) {
    Log.log(`\nLogs for your project will appear below. ${chalk.dim(`Press Ctrl+C to exit.`)}`);
  }
}

async function getBundleIdentifierForBinaryAsync(binaryPath: string): Promise<string> {
  const builtInfoPlistPath = path.join(binaryPath, 'Info.plist');
  const { CFBundleIdentifier } = await parsePlistAsync(builtInfoPlistPath);
  return CFBundleIdentifier;
}
