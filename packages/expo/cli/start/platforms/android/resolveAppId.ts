import { getConfig } from '@expo/config';
import { AndroidConfig } from '@expo/config-plugins';

import { CommandError } from '../../../utils/errors';

async function isManagedProjectAsync(projectRoot: string) {
  try {
    await AndroidConfig.Paths.getProjectPathOrThrowAsync(projectRoot);
    return false;
  } catch {
    return true;
  }
}

async function resolveNativeApplicationIdAsync(projectRoot: string): Promise<string | null> {
  try {
    const applicationIdFromGradle = await AndroidConfig.Package.getApplicationIdAsync(projectRoot);
    if (applicationIdFromGradle) {
      return applicationIdFromGradle;
    }
  } catch {}

  try {
    const filePath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const androidManifest = await AndroidConfig.Manifest.readAndroidManifestAsync(filePath);
    // Assert MainActivity defined.
    await AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
    if (androidManifest.manifest?.$?.package) {
      return androidManifest.manifest.$.package;
    }
  } catch {}

  return getConfig(projectRoot).exp.android?.package ?? null;
}

export async function resolveAppIdAsync(projectRoot: string) {
  const isManaged = await isManagedProjectAsync(projectRoot);
  if (isManaged) {
    const { exp } = getConfig(projectRoot);
    const applicationId = exp?.android?.package;
    if (!applicationId) {
      throw new CommandError(
        `Could not find property android.package in app.config.js/app.json. This setting is required to launch the app.`
      );
    }
    return applicationId;
  }

  const applicationId = await resolveNativeApplicationIdAsync(projectRoot);
  if (!applicationId) {
    throw new CommandError(
      `Could not find applicationId in ${AndroidConfig.Paths.getAppBuildGradleFilePath(
        projectRoot
      )}`
    );
  }
  return applicationId;
}
