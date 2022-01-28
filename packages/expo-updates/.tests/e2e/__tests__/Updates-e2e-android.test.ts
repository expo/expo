import spawnAsync from '@expo/spawn-async';
import * as Server from './utils/server';

const APK_PATH =
  '/Users/eric/expo/updates-e2e/android/app/build/outputs/apk/release/app-release.apk';

const PACKAGE_NAME = 'dev.expo.updatese2e';
const ACTIVITY_NAME = `${PACKAGE_NAME}/${PACKAGE_NAME}.MainActivity`;

async function installAndroidApk(apkPath: string) {
  await spawnAsync('adb', ['install', apkPath]);
}

async function uninstallAndroidApk(packageName: string) {
  await spawnAsync('adb', ['uninstall', packageName]);
}

async function startActivity(activityName: string) {
  await spawnAsync('adb', ['shell', 'am', 'start', '-n', activityName]);
}

async function stopApplication(packageName: string) {
  await spawnAsync('adb', ['shell', 'am', 'force-stop', packageName]);
}

beforeEach(async () => {});

afterEach(async () => {
  await uninstallAndroidApk(PACKAGE_NAME);
  Server.stop();
});

xtest('server', async () => {
  Server.start(4747);
  try {
    const response = await Server.waitForResponse(2000);
    expect(response).toBe('blah');
  } finally {
    Server.stop();
  }
});

test('installs, kills, starts again', async () => {
  jest.setTimeout(60000);
  Server.start(4747);
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const response = await Server.waitForResponse(10000);
  expect(response).toBe('erictest');
  await stopApplication(PACKAGE_NAME);

  let didError = false;
  try {
    await Server.waitForResponse(5000);
  } catch (e) {
    didError = true;
  }
  expect(didError).toBe(true);

  await startActivity(ACTIVITY_NAME);
  const response2 = await Server.waitForResponse(10000);
  expect(response2).toBe('erictest');
});
