/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';

import { execFile } from '../../utils/process';

export async function getXCodePath() {
  try {
    const { stdout } = await execFile('xcode-select', ['-p'], {
      encoding: 'utf8',
    });
    if (stdout) {
      return stdout.trim();
    }
  } catch {
    // ignore
  }
  throw new Error('Unable to get Xcode location. Is Xcode installed?');
}

export async function getDeveloperDiskImagePath(version: string) {
  const xCodePath = await getXCodePath();
  const versionDirs = await fs.promises.readdir(
    `${xCodePath}/Platforms/iPhoneOS.platform/DeviceSupport/`
  );
  const versionPrefix = version.match(/\d+\.\d+/);
  if (versionPrefix === null) {
    throw new Error(`Invalid iOS version: ${version}`);
  }
  // Can look like "11.2 (15C107)"
  for (const dir of versionDirs) {
    if (dir.includes(versionPrefix[0])) {
      return `${xCodePath}/Platforms/iPhoneOS.platform/DeviceSupport/${dir}/DeveloperDiskImage.dmg`;
    }
  }
  throw new Error(
    `Unable to find Developer Disk Image path for SDK ${version}. Do you have the right version of Xcode?`
  );
}
