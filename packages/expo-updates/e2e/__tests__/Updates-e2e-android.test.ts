import spawnAsync from '@expo/spawn-async';
import path from 'path';
import * as Server from './utils/server';

const SERVER_PORT = parseInt(process.env.UPDATES_PORT, 10);
const APK_PATH = process.env.TEST_APK_PATH;
const ADB_PATH = process.env.HOME
  ? path.join(process.env.HOME, 'Library', 'Android', 'sdk', 'platform-tools', 'adb')
  : 'adb';

const PACKAGE_NAME = 'dev.expo.updatese2e';
const ACTIVITY_NAME = `${PACKAGE_NAME}/${PACKAGE_NAME}.MainActivity`;

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
  jest.setTimeout(300000);
  Server.start(SERVER_PORT);
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const response = await Server.waitForResponse(10000);
  expect(response).toBe('test');
  await stopApplication(PACKAGE_NAME);

  await expect(Server.waitForResponse(5000)).rejects.toThrow('expected error');

  await startActivity(ACTIVITY_NAME);
  const response2 = await Server.waitForResponse(10000);
  expect(response2).toBe('test');
});
