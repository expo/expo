#!/usr/bin/env node
// @ts-check

const spawnAsync = require('@expo/spawn-async');
const assert = require('node:assert');
const path = require('path');

const {
  createMaestroFlowAsync,
  fileExistsAsync,
  getStartMode,
  retryAsync,
  getMaestroFlowFilePath,
} = require('./lib/e2e-common.js');

const APP_ID = 'dev.expo.payments';
const OUTPUT_APP_PATH = 'android/app/build/outputs/apk/release/app-release.apk';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start
const NUM_OF_RETRIES = 6; // Number of retries for the suite

(async () => {
  try {
    const startMode = getStartMode(__filename);

    const adbPath = await findAdbAsync();
    assert(adbPath, 'adb not found in PATH or ANDROID_HOME');

    const projectRoot = path.resolve(__dirname, '..');
    const appBinaryPath = path.join(projectRoot, OUTPUT_APP_PATH);

    if (startMode === 'BUILD' || startMode === 'BUILD_AND_TEST') {
      await buildAsync(projectRoot);
    }
    if (startMode === 'TEST' || startMode === 'BUILD_AND_TEST') {
      assert(
        await fileExistsAsync(appBinaryPath),
        `App binary not found at path: ${appBinaryPath}`
      );
      const deviceId = await queryDeviceIdAsync(adbPath);
      if (!deviceId) {
        throw new Error(`No connected Android device found`);
      }
      await createMaestroFlowAsync({
        appId: APP_ID,
        workflowFile: getMaestroFlowFilePath(projectRoot),
        confirmFirstRunPrompt: true,
      });

      await retryAsync((retryNumber) => {
        console.log(`Test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
        return testAsync(projectRoot, deviceId, appBinaryPath, adbPath);
      }, NUM_OF_RETRIES);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

/** @param {string} projectRoot */
async function buildAsync(projectRoot) {
  console.log('\n💿 Building App');
  await spawnAsync('./gradlew', ['assembleRelease'], {
    stdio: 'inherit',
    cwd: path.join(projectRoot, 'android'),
  });
}

/**
 * @param {string} projectRoot
 * @param {string} deviceId
 * @param {string} appBinaryPath
 * @param {string} adbPath
 * @returns {Promise<void>}
 */
async function testAsync(projectRoot, deviceId, appBinaryPath, adbPath) {
  console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
  await spawnAsync(adbPath, ['-s', deviceId, 'install', '-r', appBinaryPath]);

  const maestroFlowFilePath = getMaestroFlowFilePath(projectRoot);
  console.log(`\n📷 Starting Maestro tests - maestroFlowFilePath[${maestroFlowFilePath}]`);
  await spawnAsync('maestro', ['--platform', 'android', 'test', maestroFlowFilePath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      MAESTRO_DRIVER_STARTUP_TIMEOUT,
    },
  });
}

/** @returns {Promise<string | null>} */
async function findAdbAsync() {
  /** @type {string | null} */
  let adbPath = null;
  try {
    const { stdout } = await spawnAsync('which', ['adb']);
    adbPath = stdout.trim();
  } catch {}

  const androidHomeAdbPath = path.join(process.env.ANDROID_HOME || '', 'platform-tools', 'adb');
  if (await fileExistsAsync(androidHomeAdbPath)) {
    adbPath = androidHomeAdbPath;
  }

  return adbPath;
}

/**
 * @param {string} adbPath
 * @returns {Promise<string | null>}
 */
async function queryDeviceIdAsync(adbPath) {
  const { stdout } = await spawnAsync(adbPath, ['devices']);
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.startsWith('List of devices')) {
      continue;
    }
    if (line.includes('device')) {
      return line.split('\t')[0];
    }
  }
  return null;
}
