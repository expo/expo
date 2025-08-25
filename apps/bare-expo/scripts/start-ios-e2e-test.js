#!/usr/bin/env node
// @ts-check

const XcodeBuild = require('@expo/cli/build/src/run/ios/XcodeBuild');
const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

const {
  createMaestroFlowAsync,
  ensureDirAsync,
  getStartMode,
  retryAsync,
  getMaestroFlowFilePath,
} = require('./lib/e2e-common.js');

const TARGET_DEVICE = 'iPhone 16 Pro';
const TARGET_DEVICE_IOS_VERSION = 18;
const APP_ID = 'dev.expo.Payments';
const OUTPUT_APP_PATH = 'ios/build/BareExpo.app';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start
const NUM_OF_RETRIES = 6; // Number of retries for the suite

(async () => {
  try {
    const startMode = getStartMode(__filename);

    const projectRoot = path.resolve(__dirname, '..');
    const deviceId = await queryDeviceIdAsync(TARGET_DEVICE_IOS_VERSION, TARGET_DEVICE);
    if (!deviceId) {
      throw new Error(`Device not found: ${TARGET_DEVICE}`);
    }

    const appBinaryPath = path.join(projectRoot, OUTPUT_APP_PATH);
    if (startMode === 'BUILD' || startMode === 'BUILD_AND_TEST') {
      const binaryPath = await buildAsync(projectRoot, deviceId);
      await ensureDirAsync(path.dirname(appBinaryPath));
      await fs.cp(binaryPath, appBinaryPath, { recursive: true });
    }
    if (startMode === 'TEST' || startMode === 'BUILD_AND_TEST') {
      await createMaestroFlowAsync({
        appId: APP_ID,
        workflowFile: getMaestroFlowFilePath(projectRoot),
        confirmFirstRunPrompt: true,
      });

      await retryAsync((retryNumber) => {
        console.log(`Test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
        return testAsync(projectRoot, deviceId, appBinaryPath);
      }, NUM_OF_RETRIES);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

/**
 * @param {string} projectRoot
 * @param {string} deviceId
 * @returns {Promise<string>}
 */
async function buildAsync(projectRoot, deviceId) {
  console.log('\n💿 Building App');
  const buildOutput = await XcodeBuild.buildAsync({
    projectRoot,
    isSimulator: true,
    xcodeProject: {
      name: path.join(projectRoot, 'ios', 'BareExpo.xcworkspace'),
      isWorkspace: true,
    },
    device: {
      name: TARGET_DEVICE,
      udid: deviceId,
    },
    configuration: 'Release',
    shouldSkipInitialBundling: false,
    buildCache: true,
    scheme: 'BareExpo',
    port: 8081,
    shouldStartBundler: false,
  });

  const binaryPath = await XcodeBuild.getAppBinaryPath(buildOutput);
  return binaryPath;
}

/**
 * @param {string} projectRoot
 * @param {string} deviceId
 * @param {string} appBinaryPath
 * @returns {Promise<void>}
 */
async function testAsync(projectRoot, deviceId, appBinaryPath) {
  try {
    console.log(`\n📱 Starting Device - name[${TARGET_DEVICE}] udid[${deviceId}]`);
    await spawnAsync('xcrun', ['simctl', 'bootstatus', deviceId, '-b'], { stdio: 'inherit' });
    await spawnAsync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', deviceId], {
      stdio: 'inherit',
    });

    console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
    await spawnAsync('xcrun', ['simctl', 'install', deviceId, appBinaryPath], { stdio: 'inherit' });

    const maestroFlowFilePath = getMaestroFlowFilePath(projectRoot);
    console.log(`\n📷 Starting Maestro tests - maestroFlowFilePath[${maestroFlowFilePath}]`);
    await spawnAsync('maestro', ['--device', deviceId, 'test', maestroFlowFilePath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        MAESTRO_DRIVER_STARTUP_TIMEOUT,
      },
    });
  } finally {
    await spawnAsync('xcrun', ['simctl', 'shutdown', deviceId], { stdio: 'inherit' });
  }
}

/**
 * Query simulator UDID
 * @param {number} iosVersion
 * @param {string} device
 * @returns {Promise<string | null>}
 */
async function queryDeviceIdAsync(iosVersion, device) {
  const { stdout } = await spawnAsync('xcrun', [
    'simctl',
    'list',
    'devices',
    'iPhone',
    'available',
    '--json',
  ]);
  const { devices: deviceWithRuntimes } = JSON.parse(stdout);

  // Try to find the target device first
  for (const [runtime, devices] of Object.entries(deviceWithRuntimes)) {
    if (runtime.startsWith(`com.apple.CoreSimulator.SimRuntime.iOS-${iosVersion}-`)) {
      for (const { name, udid } of devices) {
        if (name === device) {
          return udid;
        }
      }
    }
  }

  // Fallback to the first available device
  const firstEntry = Object.entries(deviceWithRuntimes).find(
    ([runtime, devices]) => devices.length > 0
  );
  return firstEntry?.[1][0]?.udid ?? null;
}
