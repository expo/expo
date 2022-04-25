import spawnAsync from '@expo/spawn-async';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { setTimeout } from 'timers/promises';
import uuid from 'uuid/v4';

import * as Server from './utils/server';

const SERVER_HOST = '10.0.2.2';
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

// Keep in sync with the manifest in .github/workflows/updates-e2e.yml
const RUNTIME_VERSION = '1.0.0';
const EXPORT_PUBLIC_URL = 'https://expo.dev/dummy-url';
const BUNDLE_DIST_PATH = process.env.TEST_BUNDLE_DIST_PATH;
let bundlePath: string | null = null;

const PACKAGE_NAME = 'dev.expo.updatese2e';
const ACTIVITY_NAME = `${PACKAGE_NAME}/${PACKAGE_NAME}.MainActivity`;
const TIMEOUT_BIAS = process.env.CI ? 10 : 1;

// android utils

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

// general test utils

function findBundlePath(): string {
  if (!bundlePath) {
    const androidClassicManifest = require(path.join(BUNDLE_DIST_PATH, 'android-index.json'));
    const { bundleUrl }: { bundleUrl: string } = androidClassicManifest;
    bundlePath = path.join(BUNDLE_DIST_PATH, bundleUrl.replace(EXPORT_PUBLIC_URL, ''));
  }
  return bundlePath;
}

async function copyBundleToStaticFolder(filename: string, notifyString?: string): Promise<string> {
  const staticFolder = path.join(__dirname, '.static');
  await fs.mkdir(staticFolder, { recursive: true });
  let bundleString = await fs.readFile(findBundlePath(), 'utf-8');
  if (notifyString) {
    bundleString = bundleString.replace('/notify/test', `/notify/${notifyString}`);
  }
  await fs.writeFile(path.join(staticFolder, filename), bundleString, 'utf-8');
  return crypto.createHash('sha256').update(bundleString, 'utf-8').digest('base64url');
}

// tests

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

test('initial request includes correct update-id headers', async () => {
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
});

test('downloads and runs update, and updates current-update-id header', async () => {
  jest.setTimeout(300000 * TIMEOUT_BIAS);
  const hash = await copyBundleToStaticFolder('bundle1.js', 'test-update-1');
  const manifest = {
    id: uuid(),
    createdAt: new Date().getTime(),
    runtimeVersion: RUNTIME_VERSION,
    launchAsset: {
      hash,
      key: '801599597d77b3522bf40c7021eb0313',
      contentType: 'application/javascript',
      url: `http://${SERVER_HOST}:${SERVER_PORT}/static/bundle1.js`,
    },
    assets: [],
    metadata: {},
    extra: {},
  };

  Server.start(SERVER_PORT);
  Server.serveManifest(manifest, { 'expo-protocol-version': '0' });
  await installAndroidApk(APK_PATH);
  await startActivity(ACTIVITY_NAME);
  const firstRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  const response = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(response).toBe('test');

  // give the app time to load the new update in the background
  await setTimeout(2000 * TIMEOUT_BIAS);

  // restart the app so it will launch the new update
  await stopApplication(PACKAGE_NAME);
  await startActivity(ACTIVITY_NAME);
  const secondRequest = await Server.waitForUpdateRequest(10000 * TIMEOUT_BIAS);
  const updatedResponse = await Server.waitForResponse(10000 * TIMEOUT_BIAS);
  expect(updatedResponse).toBe('test-update-1');

  expect(secondRequest.headers['expo-embedded-update-id']).toBeDefined();
  expect(secondRequest.headers['expo-embedded-update-id']).toEqual(
    firstRequest.headers['expo-embedded-update-id']
  );
  expect(secondRequest.headers['expo-current-update-id']).toBeDefined();
  expect(secondRequest.headers['expo-current-update-id']).toEqual(manifest.id);
});
