import chalk from 'chalk';
import { Ora } from 'ora';
import os from 'os';
import path from 'path';
import { AppleDevice } from 'xdl';

import { ensureDirectory } from '../../utils/dir';
import { CI } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { ora } from '../../utils/ora';
import { confirmAsync } from '../../utils/prompts';
import * as IOSDeploy from './IOSDeploy';

/**
 * Get the app_delta folder for faster subsequent rebuilds on devices.
 *
 * @param bundleId
 * @returns
 */
export function getAppDeltaDirectory(bundleId: string): string {
  // TODO: Maybe use .expo folder instead for debugging
  // TODO: Reuse existing folder from xcode?
  const deltaFolder = path.join(os.tmpdir(), 'ios', 'app-delta', bundleId);
  ensureDirectory(deltaFolder);
  return deltaFolder;
}

// To debug: `export DEBUG=expo:xdl:*`
export async function installOnDeviceAsync(props: {
  bundle: string;
  bundleIdentifier: string;
  appDeltaDirectory: string;
  udid: string;
  deviceName: string;
}): Promise<void> {
  if (!AppleDevice.isEnabled()) {
    return await IOSDeploy.installOnDeviceAsync(props);
  }

  const { bundle, bundleIdentifier, appDeltaDirectory, udid, deviceName } = props;
  let indicator: Ora | undefined;

  try {
    // TODO: Connect for logs
    await AppleDevice.runOnDevice({
      udid,
      appPath: bundle,
      bundleId: bundleIdentifier,
      waitForApp: false,
      deltaPath: appDeltaDirectory,
      onProgress({
        status,
        isComplete,
        progress,
      }: {
        status: string;
        isComplete: boolean;
        progress: number;
      }) {
        if (!indicator) {
          indicator = ora(status).start();
        }
        indicator.text = `${chalk.bold(status)} ${progress}%`;
        if (isComplete) {
          indicator.succeed();
        }
      },
    });
  } catch (err: any) {
    if (indicator) {
      indicator.fail();
    }
    if (err.code === 'DeviceLocked') {
      // Get the app name from the binary path.
      const appName = path.basename(bundle).split('.')[0] ?? 'app';
      if (
        !CI &&
        (await confirmAsync({
          message: `Cannot launch ${appName} because the device is locked. Unlock ${deviceName} to continue...`,
          initial: true,
        }))
      ) {
        return installOnDeviceAsync(props);
      }
      throw new CommandError(
        `Cannot launch ${appName} on ${deviceName} because the device is locked.`
      );
    }
    throw err;
  }
}
