import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';

import { CommandError } from '../../../utils/errors';

/**
 * Resolve the best possible bundle identifier for the project.
 * 1. Check the bundle identifier in the Xcode project.
 * 2. Check the Info.plist file.
 * 3. Check the Expo config.
 */
export async function resolveAppIdAsync(projectRoot: string): Promise<string> {
  // Check xcode project
  try {
    const bundleId = IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj(projectRoot);
    if (bundleId) {
      return bundleId;
    }
  } catch {}

  // Check Info.plist
  try {
    const infoPlistPath = IOSConfig.Paths.getInfoPlistPath(projectRoot);
    const data = await plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
    if (data.CFBundleIdentifier && !data.CFBundleIdentifier.startsWith('$(')) {
      return data.CFBundleIdentifier ?? null;
    }
  } catch {}

  // Check Expo config
  const bundleIdentifier = getConfig(projectRoot).exp.ios?.bundleIdentifier;
  if (!bundleIdentifier) {
    throw new CommandError(
      'APP_ID',
      `Project does not define an iOS bundle identifier in the Expo config.`
    );
  }
  return bundleIdentifier;
}
