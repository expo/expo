import { getConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';

export async function resolveAppIdAsync(projectRoot: string) {
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
      return data.CFBundleIdentifier;
    }
  } catch {}

  // Check Expo config
  return getConfig(projectRoot).exp.ios?.bundleIdentifier;
}
