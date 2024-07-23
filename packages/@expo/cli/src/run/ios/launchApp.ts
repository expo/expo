import chalk from 'chalk';
import path from 'path';

import * as XcodeBuild from './XcodeBuild';
import { BuildProps } from './XcodeBuild.types';
import { getAppDeltaDirectory, installOnDeviceAsync } from './appleDevice/installOnDeviceAsync';
import { Log } from '../../log';
import { AppleDeviceManager } from '../../start/platforms/ios/AppleDeviceManager';
import { launchBinaryOnMacAsync } from '../../start/platforms/ios/devicectl';
import { SimulatorLogStreamer } from '../../start/platforms/ios/simctlLogging';
import { DevServerManager } from '../../start/server/DevServerManager';
import { parsePlistAsync } from '../../utils/plist';
import { profile } from '../../utils/profile';

type BinaryLaunchInfo = {
  bundleId: string;
  schemes: string[];
};

/** Install and launch the app binary on a device. */
export async function launchAppAsync(
  binaryPath: string,
  manager: DevServerManager,
  props: Pick<BuildProps, 'isSimulator' | 'device' | 'shouldStartBundler'>,
  appId?: string
) {
  appId ??= (await profile(getLaunchInfoForBinaryAsync)(binaryPath)).bundleId;

  Log.log(chalk.gray`\u203A Installing ${binaryPath}`);
  if (!props.isSimulator) {
    if (props.device.osType === 'macOS') {
      await launchBinaryOnMacAsync(appId, binaryPath);
    } else {
      await profile(installOnDeviceAsync)({
        bundleIdentifier: appId,
        bundle: binaryPath,
        appDeltaDirectory: getAppDeltaDirectory(appId),
        udid: props.device.udid,
        deviceName: props.device.name,
      });
    }

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

export async function getLaunchInfoForBinaryAsync(binaryPath: string): Promise<BinaryLaunchInfo> {
  const builtInfoPlistPath = path.join(binaryPath, 'Info.plist');
  const { CFBundleIdentifier, CFBundleURLTypes } = await parsePlistAsync(builtInfoPlistPath);

  let schemes: string[] = [];

  if (Array.isArray(CFBundleURLTypes)) {
    schemes =
      CFBundleURLTypes.reduce<string[]>((acc, urlType: unknown) => {
        if (
          urlType &&
          typeof urlType === 'object' &&
          'CFBundleURLSchemes' in urlType &&
          Array.isArray(urlType.CFBundleURLSchemes)
        ) {
          return [...acc, ...urlType.CFBundleURLSchemes];
        }
        return acc;
      }, []) ?? [];
  }

  return { bundleId: CFBundleIdentifier, schemes };
}
