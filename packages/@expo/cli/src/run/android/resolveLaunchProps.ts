import { AndroidConfig } from '@expo/config-plugins';

import { AndroidAppIdResolver } from '../../start/platforms/android/AndroidAppIdResolver';
import { CommandError } from '../../utils/errors';

export interface LaunchProps {
  packageName: string;
  mainActivity: string;
  launchActivity: string;
}

async function getMainActivityAsync(projectRoot: string): Promise<string> {
  const filePath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
  const androidManifest = await AndroidConfig.Manifest.readAndroidManifestAsync(filePath);

  // Assert MainActivity defined.
  const activity = await AndroidConfig.Manifest.getRunnableActivity(androidManifest);
  if (!activity) {
    throw new CommandError(
      'ANDROID_MALFORMED',
      `${filePath} is missing a runnable activity element.`
    );
  }
  // Often this is ".MainActivity"
  return activity.$['android:name'];
}

export async function resolveLaunchPropsAsync(
  projectRoot: string,
  options: { appIdSuffix?: string }
): Promise<LaunchProps> {
  // Often this is ".MainActivity"
  const mainActivity = await getMainActivityAsync(projectRoot);

  const packageName = await new AndroidAppIdResolver(projectRoot).getAppIdFromNativeAsync();
  const packageNameWithSuffix = options.appIdSuffix
    ? `${packageName}.${options.appIdSuffix}`
    : packageName;

    const activityToLaunch =
    mainActivity.startsWith(packageName) ||
    (!mainActivity.startsWith('.') && mainActivity.includes('.'))
      ? mainActivity
      : mainActivity.startsWith('.')
      ? [packageName, mainActivity].join('')
      : [packageName, mainActivity].filter(Boolean).join('.');

  const launchActivity = `${packageNameWithSuffix}/${activityToLaunch}`;

  return {
    mainActivity,
    launchActivity,
    packageName: packageNameWithSuffix,
  };
}
