import { AndroidConfig } from '@expo/config-plugins';

import { AppIdResolver } from '../AppIdResolver';

const debug = require('debug')(
  'expo:start:platforms:android:AndroidAppIdResolver'
) as typeof console.log;

/** Resolves the Android package name from the Expo config or native files. */
export class AndroidAppIdResolver extends AppIdResolver {
  constructor(projectRoot: string) {
    super(projectRoot, 'android', 'android.package');
  }

  async hasNativeProjectAsync(): Promise<boolean> {
    try {
      await AndroidConfig.Paths.getProjectPathOrThrowAsync(this.projectRoot);
      return true;
    } catch (error: any) {
      debug('Expected error checking for native project:', error.message);
      return false;
    }
  }

  async resolveAppIdFromNativeAsync(): Promise<string | null> {
    const applicationIdFromGradle = await AndroidConfig.Package.getApplicationIdAsync(
      this.projectRoot
    ).catch(() => null);
    if (applicationIdFromGradle) {
      return applicationIdFromGradle;
    }

    try {
      const filePath = await AndroidConfig.Paths.getAndroidManifestAsync(this.projectRoot);
      const androidManifest = await AndroidConfig.Manifest.readAndroidManifestAsync(filePath);
      // Assert MainActivity defined.
      await AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
      if (androidManifest.manifest?.$?.package) {
        return androidManifest.manifest.$.package;
      }
    } catch (error: any) {
      debug('Expected error resolving the package name from the AndroidManifest.xml:', error);
    }

    return null;
  }
}
