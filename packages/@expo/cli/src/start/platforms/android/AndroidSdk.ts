import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * The default Android SDK locations per platform.
 * @see https://developer.android.com/studio/run/emulator-commandline#filedir
 * @see https://developer.android.com/studio/intro/studio-config#optimize-studio-windows
 */
const ANDROID_DEFAULT_LOCATION = {
  darwin: path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  linux: [path.join(os.homedir(), 'Android', 'Sdk'), path.join(os.homedir(), 'Android', 'sdk')],
  win32: path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
};

const isAndroidDefaultLocationKey = (
  platform: string
): platform is keyof typeof ANDROID_DEFAULT_LOCATION =>
  ANDROID_DEFAULT_LOCATION[platform as keyof typeof ANDROID_DEFAULT_LOCATION] != null;

/**
 * Resolve and validate the root folder where the Android SDK has been installed.
 * This checks both `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and the default path for the current platform.
 * @see https://developer.android.com/studio/command-line/variables
 */
export function assertSdkRoot(): string | null {
  if (process.env.ANDROID_HOME) {
    assert(
      fs.existsSync(process.env.ANDROID_HOME),
      `Failed to resolve the Android SDK path. ANDROID_HOME is set to a non-existing path: ${process.env.ANDROID_HOME}`
    );
    return process.env.ANDROID_HOME;
  }

  if (process.env.ANDROID_SDK_ROOT) {
    assert(
      fs.existsSync(process.env.ANDROID_SDK_ROOT),
      `Failed to resolve the Android SDK path. Deprecated ANDROID_SDK_ROOT is set to a non-existing path: ${process.env.ANDROID_SDK_ROOT}. Use ANDROID_HOME instead.`
    );
    return process.env.ANDROID_SDK_ROOT;
  }

  const platform = process.platform;
  if (!isAndroidDefaultLocationKey(platform)) {
    return null;
  }

  const defaultLocation = ANDROID_DEFAULT_LOCATION[platform];
  const locations = !Array.isArray(defaultLocation) ? [defaultLocation] : defaultLocation;
  const resolvedLocation = locations.find((location) => fs.existsSync(location));
  assert(
    !!resolvedLocation,
    `Failed to resolve the Android SDK path. Default install location not found: ${locations[0]}. Use ANDROID_HOME to set the Android SDK location.`
  );
  return resolvedLocation;
}
