import spawnAsync from '@expo/spawn-async';
import path from 'path';
import * as Server from './utils/server';

const SERVER_PORT = parseInt(process.env.UPDATES_PORT);
const APK_PATH = process.env.TEST_APK_PATH;
const ADB_PATH = process.env.HOME
  ? path.join(process.env.HOME, 'Library', 'Android', 'sdk', 'platform-tools', 'adb')
  : 'adb';

const PACKAGE_NAME = 'dev.expo.updatese2e';
const ACTIVITY_NAME = `${PACKAGE_NAME}/${PACKAGE_NAME}.MainActivity`;

async function installAndroidApk(apkPath: string) {
  await spawnAsync(ADB_PATH, ['install', apkPath], { stdio: 'inherit' });
}

async function uninstallAndroidApk(packageName: string) {
  await spawnAsync(ADB_PATH, ['uninstall', packageName], { stdio: 'inherit' });
}

async function startActivity(activityName: string) {
  await spawnAsync(ADB_PATH, ['shell', 'am', 'start', '-n', activityName], { stdio: 'inherit' });
}

async function stopApplication(packageName: string) {
  await spawnAsync(ADB_PATH, ['shell', 'am', 'force-stop', packageName], { stdio: 'inherit' });
}

beforeEach(async () => {});

afterEach(async () => {
  await uninstallAndroidApk(PACKAGE_NAME);
  Server.stop();
});

test('starts app, stops, and starts again', async () => {
  jest.setTimeout(300000);
  try {
    Server.start(SERVER_PORT);
    await installAndroidApk(APK_PATH);
    await startActivity(ACTIVITY_NAME);
    const response = await Server.waitForResponse(10000);
    console.log('got first response');
    expect(response).toBe('test');
    await stopApplication(PACKAGE_NAME);

    let didError = false;
    try {
      await Server.waitForResponse(5000);
    } catch (e) {
      didError = true;
    }
    expect(didError).toBe(true);
    console.log('got first non-response');

    await startActivity(ACTIVITY_NAME);
    const response2 = await Server.waitForResponse(10000);
    console.log('got second response');
    expect(response2).toBe('test');
  } catch (e) {
    console.error(e);
    throw e;
  }
});
