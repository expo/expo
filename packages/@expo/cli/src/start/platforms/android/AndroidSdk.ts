import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * The default Android SDK locations per platform.
 * @see https://developer.android.com/studio/run/emulator-commandline#filedir
 * @see https://developer.android.com/studio/intro/studio-config#optimize-studio-windows
 */
const ANDROID_DEFAULT_LOCATION: Readonly<Partial<Record<NodeJS.Platform, string>>> = {
  darwin: path.join(os.homedir(), 'Library', 'Android', 'sdk'), 
  linux: path.join(os.homedir(), 'Android', 'sdk'),
  win32: path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
};

/**
 * Resolve the root folder where the Android SDK has been installed.
 * This checks both `ANDROID_HOME`, `ANDROID_SDK_ROOT`, and the default path for the current platform.
 * @see https://developer.android.com/studio/command-line/variables
 */
export function resolveSdkRoot() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }

  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }

  const defaultLocation = ANDROID_DEFAULT_LOCATION[process.platform];
  if (defaultLocation && fs.existsSync(defaultLocation)) {
    return defaultLocation;
  }

  return null;
}

