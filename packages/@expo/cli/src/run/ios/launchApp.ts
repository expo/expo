import chalk from 'chalk';
import path from 'path';

import * as XcodeBuild from './XcodeBuild';
import { BuildProps } from './XcodeBuild.types';
import { getAppDeltaDirectory, installOnDeviceAsync } from './appleDevice/installOnDeviceAsync';
import { AppleDeviceManager } from '../../start/platforms/ios/AppleDeviceManager';
import { SimulatorLogStreamer } from '../../start/platforms/ios/simctlLogging';
import { DevServerManager } from '../../start/server/DevServerManager';
import { parsePlistAsync } from '../../utils/plist';
import { profile } from '../../utils/profile';

/** Install and launch the app binary on a device. */
export async function launchAppAsync(
  binaryPath: string,
  manager: DevServerManager,
  props: Pick<BuildProps, 'isSimulator' | 'device' | 'shouldStartBundler'>
) {
  const appId = await profile(getBundleIdentifierForBinaryAsync)(binaryPath);

  if (!props.isSimulator) {
    await profile(installOnDeviceAsync)({
      bundleIdentifier: appId,
      bundle: binaryPath,
      appDeltaDirectory: getAppDeltaDirectory(appId),
      udid: props.device.udid,
      deviceName: props.device.name,
    });
    return;
  }

  XcodeBuild.logPrettyItem(chalk`{bold Installing} on ${props.device.name}`);

  const device = await AppleDeviceManager.resolveAsync({ device: props.device });
  await device.installAppAsync(binaryPath);

  XcodeBuild.logPrettyItem(chalk`{bold Opening} on ${device.name} {dim (${appId})}`);

  if (props.shouldStartBundler) {
    await SimulatorLogStreamer.getStreamer(device.device, {
      appId,
    }).attachAsync();
  }

  await manager.getDefaultDevServer().openCustomRuntimeAsync(
    'simulator',
    {
      applicationId: appId,
    },
    { device }
  );
}

async function getBundleIdentifierForBinaryAsync(binaryPath: string): Promise<string> {
  const builtInfoPlistPath = path.join(binaryPath, 'Info.plist');
  const { CFBundleIdentifier } = await parsePlistAsync(builtInfoPlistPath);
  return CFBundleIdentifier;
}
