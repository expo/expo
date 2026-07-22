import { IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import fs from 'fs';

import { AppIdResolver } from '../AppIdResolver';
import { event } from '../events';

/** Resolves the iOS bundle identifier from the Expo config or native files. */
export class AppleAppIdResolver extends AppIdResolver {
  constructor(projectRoot: string) {
    super(projectRoot, 'ios', 'ios.bundleIdentifier');
  }

  /** @return `true` if the app has valid `*.pbxproj` file */
  async hasNativeProjectAsync(): Promise<boolean> {
    try {
      // Never returns nullish values.
      return !!IOSConfig.Paths.getAllPBXProjectPaths(this.projectRoot).length;
    } catch (error: any) {
      event('apple_app_id_native_check_error', { error: event.error(error as Error) });
      return false;
    }
  }

  async resolveAppIdFromNativeAsync(): Promise<string | null> {
    // Check xcode project
    try {
      const bundleId = IOSConfig.BundleIdentifier.getBundleIdentifierFromPbxproj(this.projectRoot);
      if (bundleId) {
        return bundleId;
      }
    } catch (error: any) {
      event('apple_app_id_pbxproj_error', { error: event.error(error as Error) });
    }

    // Check Info.plist
    try {
      const infoPlistPath = IOSConfig.Paths.getInfoPlistPath(this.projectRoot);
      const data = await plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
      if (data.CFBundleIdentifier && !data.CFBundleIdentifier.startsWith('$(')) {
        return data.CFBundleIdentifier;
      }
    } catch (error) {
      event('apple_app_id_plist_error', { error: event.error(error as Error) });
    }

    return null;
  }
}
