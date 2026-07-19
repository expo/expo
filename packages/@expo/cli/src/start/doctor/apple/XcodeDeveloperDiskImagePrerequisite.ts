import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';

import * as Log from '../../../log';
import { Prerequisite, PrerequisiteCommandError } from '../Prerequisite';

const ERROR_CODE = 'XCODE_DEVELOPER_DISK_IMAGE';
async function getXcodePathAsync(): Promise<string> {
  try {
    const { stdout } = await spawnAsync('xcode-select', ['-p']);
    if (stdout) {
      return stdout.trim();
    }
  } catch (error: any) {
    Log.debug(`Could not find Xcode path: %O`, error);
  }
  throw new PrerequisiteCommandError(ERROR_CODE, 'Unable to locate Xcode.');
}

export class XcodeDeveloperDiskImagePrerequisite extends Prerequisite<string, { version: string }> {
  static instance = new XcodeDeveloperDiskImagePrerequisite();

  async assertImplementation({ version }: { version: string }): Promise<string> {
    const xcodePath = await getXcodePathAsync();
    // Like "11.2 (15C107)"
    const versions = await fs.readdir(`${xcodePath}/Platforms/iPhoneOS.platform/DeviceSupport/`);
    const prefix = version.match(/\d+\.\d+/);
    if (prefix === null) {
      throw new PrerequisiteCommandError(ERROR_CODE, `Invalid iOS version: ${version}`);
    }
    for (const directory of versions) {
      if (directory.includes(prefix[0])) {
        return `${xcodePath}/Platforms/iPhoneOS.platform/DeviceSupport/${directory}/DeveloperDiskImage.dmg`;
      }
    }
    throw new PrerequisiteCommandError(
      ERROR_CODE,
      `Unable to find Developer Disk Image path for SDK ${version}.`
    );
  }
}
