import { AndroidConfig } from '@expo/config-plugins';

import { AppIdResolver } from '../AppIdResolver';
import { event } from '../events';

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
      event('android_native_project_check_error', { message: error.message });
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
      event('android_manifest_resolve_error', { message: error.message });
    }

    return null;
  }
}
