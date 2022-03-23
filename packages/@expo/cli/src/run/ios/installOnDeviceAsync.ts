import os from 'os';
import path from 'path';

import { ensureDirectory } from '../../utils/dir';
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

export async function installOnDeviceAsync(props: {
  bundle: string;
  bundleIdentifier: string;
  appDeltaDirectory: string;
  udid: string;
  deviceName: string;
}): Promise<void> {
  // TODO: Replace with a fork of `appium-ios-device` or something similar.
  return await IOSDeploy.installOnDeviceAsync(props);
}
