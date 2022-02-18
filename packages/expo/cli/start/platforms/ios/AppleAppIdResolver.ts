import { IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';

import { AppIdResolver } from '../AppIdResolver';

/** Resolves the iOS bundle identifier from the Expo config or native files. */
export class AppleAppIdResolver extends AppIdResolver {
  constructor(projectRoot: string) {
    super(projectRoot, 'ios', 'ios.bundleIdentifier');
  }

  async hasNativeProjectAsync(): Promise<boolean> {
    try {
      return !!IOSConfig.Paths.getAppDelegateFilePath(this.projectRoot);
    } catch {
      return true;
    }
  }

  async resolveAppIdFromNativeAsync(): Promise<string | null> {
    // Check xcode project
    try {
      const bundleId = IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj(this.projectRoot);
      if (bundleId) {
        return bundleId;
      }
    } catch {}

    // Check Info.plist
    try {
      const infoPlistPath = IOSConfig.Paths.getInfoPlistPath(this.projectRoot);
      const data = await plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
      if (data.CFBundleIdentifier && !data.CFBundleIdentifier.startsWith('$(')) {
        return data.CFBundleIdentifier ?? null;
      }
    } catch {}

    return null;
  }
}
