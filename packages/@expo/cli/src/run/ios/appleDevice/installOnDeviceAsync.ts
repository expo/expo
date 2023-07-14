import chalk from 'chalk';
import { Ora } from 'ora';
import os from 'os';
import path from 'path';

import * as AppleDevice from './AppleDevice';
import { ensureDirectory } from '../../../utils/dir';
import { CommandError } from '../../../utils/errors';
import { isInteractive } from '../../../utils/interactive';
import { ora } from '../../../utils/ora';
import { confirmAsync } from '../../../utils/prompts';

/** Get the app_delta folder for faster subsequent rebuilds on devices. */
export function getAppDeltaDirectory(bundleId: string): string {
  // TODO: Maybe use .expo folder instead for debugging
  // TODO: Reuse existing folder from xcode?
  const deltaFolder = path.join(os.tmpdir(), 'ios', 'app-delta', bundleId);
  ensureDirectory(deltaFolder);
  return deltaFolder;
}

/**
 * Wraps the apple device method for installing and running an app,
 * adds indicator and retry loop for when the device is locked.
 */
export async function installOnDeviceAsync(props: {
  bundle: string;
  bundleIdentifier: string;
  appDeltaDirectory: string;
  udid: string;
  deviceName: string;
}): Promise<void> {
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
  } catch (error: any) {
    if (indicator) {
      indicator.fail();
    }
    if (error.code === 'APPLE_DEVICE_LOCKED') {
      // Get the app name from the binary path.
      const appName = path.basename(bundle).split('.')[0] ?? 'app';
      if (
        isInteractive() &&
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
    throw error;
  }
}
