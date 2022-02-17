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
  const applicationIdFromGradle = await AndroidConfig.Package.getApplicationIdAsync(
    projectRoot
  ).catch(() => null);
  if (applicationIdFromGradle) {
    return applicationIdFromGradle;
  }

  try {
    const filePath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
    const androidManifest = await AndroidConfig.Manifest.readAndroidManifestAsync(filePath);
    // Assert MainActivity defined.
    await AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
    if (androidManifest.manifest?.$?.package) {
      return androidManifest.manifest.$.package;
    }
  } catch {}

  return null;
}

export async function resolveAppIdAsync(projectRoot: string): Promise<string> {
  const isManaged = await isManagedProjectAsync(projectRoot);
  if (isManaged) {
    const applicationId = getConfig(projectRoot).exp.android?.package;
    if (!applicationId) {
      throw new CommandError(
        'APP_ID',
        `Could not find property android.package in app.config.js/app.json. This setting is required to launch the app.`
      );
    }
    return applicationId;
  }

  const applicationId = await resolveNativeApplicationIdAsync(projectRoot);
  if (!applicationId) {
    throw new CommandError(
      'APP_ID',
      `Could not find applicationId in ${AndroidConfig.Paths.getAppBuildGradleFilePath(
        projectRoot
      )}`
    );
  }
  return applicationId;
}
