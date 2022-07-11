import spawnAsync from '@expo/spawn-async';
import path from 'path';

const ADB_PATH = (function () {
  if (process.env.ADB_PATH) {
    return process.env.ADB_PATH;
  }
  if (process.env.ANDROID_HOME) {
    return path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb');
  }
  if (process.env.ANDROID_SDK_ROOT) {
    // deprecated version of ANDROID_HOME
    return path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb');
  }
  if (process.env.HOME) {
    return path.join(process.env.HOME, 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
  }
  return 'adb';
})();

const PACKAGE_NAME = 'dev.expo.updatese2e';
const ACTIVITY_NAME = `${PACKAGE_NAME}/${PACKAGE_NAME}.MainActivity`;

export const ExportedManifestFilename = 'android-index.json';

export async function installApp(suffix: string) {
  const apkPath = path.join(process.env.ARTIFACTS_DEST, `android-release-${suffix}.apk`);
  await spawnAsync(ADB_PATH, ['install', apkPath]);
}

export async function uninstallApp() {
  await spawnAsync(ADB_PATH, ['uninstall', PACKAGE_NAME]);
}

export async function startApp() {
  await spawnAsync(ADB_PATH, ['shell', 'am', 'start', '-n', ACTIVITY_NAME]);
}

export async function stopApp() {
  await spawnAsync(ADB_PATH, ['shell', 'am', 'force-stop', PACKAGE_NAME]);
}
