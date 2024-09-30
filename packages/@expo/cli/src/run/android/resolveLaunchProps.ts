import { AndroidConfig } from '@expo/config-plugins';

import { AndroidAppIdResolver } from '../../start/platforms/android/AndroidAppIdResolver';
import { CommandError } from '../../utils/errors';

export interface LaunchProps {
  /**
   * The "common" Android package name, configured through the app manifest.
   * @see https://source.android.com/docs/core/architecture/hidl/code-style#package-names
   */
  packageName: string;
  /**
   * Optional customized application ID, used in product flavors.
   * @see https://developer.android.com/build/build-variants#change-app-id
   */
  customAppId?: string;
  /**
   * The main activity to launch, by default this is `.MainActivity`.
   * @see https://github.com/expo/expo/blob/c0aec226a43c0f186258a063a6145c3e52246f8a/templates/expo-template-bare-minimum/android/app/src/main/AndroidManifest.xml#L22
   */
  mainActivity: string;
  /**
   * The full launch activity reference used in the app intent to launch the app with `adb am start -n <launchActivity>`.
   * Usually, this is structured as `<package-name>/.<activity-name>`.
   * For product flavors, this is structured as `<custom-app-id>/<package-name>.<activity-name>`.
   * @see https://developer.android.com/studio/command-line/adb#IntentSpec
   */
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
  options: { appId?: string }
): Promise<LaunchProps> {
  const mainActivity = await getMainActivityAsync(projectRoot);
  const packageName = await new AndroidAppIdResolver(projectRoot).getAppIdFromNativeAsync();
  const customAppId = options.appId;

  const launchActivity =
    customAppId && customAppId !== packageName
      ? `${customAppId}/${packageName}${mainActivity}`
      : `${packageName}/${mainActivity}`;

  return {
    mainActivity,
    launchActivity,
    packageName,
    customAppId,
  };
}
