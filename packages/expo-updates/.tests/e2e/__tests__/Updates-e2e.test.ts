import spawnAsync from '@expo/spawn-async';
import { spawn } from 'child_process';
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clearLogs() {
  // using the adb shell seems to be more reliable; otherwise this sometimes fails with the message
  // `failed to clear the 'main' log` / `failed to clear the 'system' log`
  await spawnAsync('adb', ['shell', 'logcat', '-b', 'all', '-c']);
}

async function waitForLogMatching(string: string, timeout: number) {
  const logcatProcess = spawn('adb', [
    'logcat',
    '-s',
    'ReactNativeJS:I',
    '-v',
    'epoch',
    '-e',
    `"${string}"`,
  ]);

  const matchPromise = new Promise<boolean>((resolve) => {
    logcatProcess.stdout.on('data', (data) => {
      if (data.includes(`ReactNativeJS: ${string}`)) {
        resolve(true);
      }
    });
  });
  const didMatch = await Promise.race([matchPromise, delay(timeout)]);

  // cleanup
  logcatProcess.stdout.removeAllListeners();
  logcatProcess.kill();

  if (didMatch === true) {
    return true;
  } else {
    throw new Error(`Message ${string} was not logged in ${timeout} ms.`);
  }
}

beforeEach(async () => {
  // await clearLogs();
});

afterEach(async () => {
  // await uninstallAndroidApk(PACKAGE_NAME);
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

xtest('installs and starts', async () => {
  jest.setTimeout(30000);
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const didFindMatch = await waitForLogMatching('erictest', 5000);
  expect(didFindMatch).toBe(true);
});

test('installs, kills, starts again', async () => {
  jest.setTimeout(60000);
  Server.start(4747);
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const response = await Server.waitForResponse(10000);
  expect(response).toBe('erictest');
  await stopApplication(PACKAGE_NAME);

  // await clearLogs();
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

  await startActivity(ACTIVITY_NAME);
  const response3 = await Server.waitForResponse(10000);
  expect(response3).toBe('blah');
});
