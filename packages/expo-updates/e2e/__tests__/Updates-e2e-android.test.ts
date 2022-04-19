import spawnAsync from '@expo/spawn-async';
import path from 'path';

import * as Server from './utils/server';

const SERVER_PORT = parseInt(process.env.UPDATES_PORT, 10);
const APK_PATH = process.env.TEST_APK_PATH;
const ADB_PATH = (function () {
  if (process.env.ADB_PATH) {
    return process.env.ADB_PATH;
  }
  if (process.env.ANDROID_SDK_ROOT) {
    return path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb');
  }
  if (process.env.HOME) {
    return path.join(process.env.HOME, 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
  }
  return 'adb';
})();

const PACKAGE_NAME = 'dev.expo.updatese2e';
const ACTIVITY_NAME = `${PACKAGE_NAME}/${PACKAGE_NAME}.MainActivity`;
const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

async function installAndroidApk(apkPath: string) {
  await spawnAsync(ADB_PATH, ['install', apkPath]);
}

async function uninstallAndroidApk(packageName: string) {
  await spawnAsync(ADB_PATH, ['uninstall', packageName]);
}

async function startActivity(activityName: string) {
  await spawnAsync(ADB_PATH, ['shell', 'am', 'start', '-n', activityName]);
}

async function stopApplication(packageName: string) {
  await spawnAsync(ADB_PATH, ['shell', 'am', 'force-stop', packageName]);
}

beforeEach(async () => {});

afterEach(async () => {
  await uninstallAndroidApk(PACKAGE_NAME);
  Server.stop();
});

test('starts app, stops, and starts again', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  Server.start(SERVER_PORT);
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response).toBe('test');
  await stopApplication(PACKAGE_NAME);

  await expect(Server.waitForResponse(5000 * TIMEOUT_BIAS)).rejects.toThrow(
    'Timed out waiting for response'
  );

  await startActivity(ACTIVITY_NAME);
  const response2 = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response2).toBe('test');
});

test('initial request includes correct update ID headers', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  Server.start(SERVER_PORT);
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const request = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  expect(request.headers['expo-embedded-update-id']).toBeDefined();
  expect(request.headers['expo-current-update-id']).toBeDefined();
  // before any updates, the current update ID and embedded update ID should be the same
  expect(request.headers['expo-current-update-id']).toEqual(
    request.headers['expo-embedded-update-id']
  );
  await stopApplication(PACKAGE_NAME);
});
