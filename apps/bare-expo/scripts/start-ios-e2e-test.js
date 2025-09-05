#!/usr/bin/env node
// @ts-check

const XcodeBuild = require('@expo/cli/build/src/run/ios/XcodeBuild');
const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

const { bootSimulatorAsync, queryDeviceIdAsync } = require('./boot-ios-simulator.js');
const {
  createMaestroFlowAsync,
  ensureDirAsync,
  getStartMode,
  retryAsync,
  getMaestroFlowFilePath,
} = require('./lib/e2e-common.js');

const APP_ID = 'dev.expo.Payments';
const OUTPUT_APP_PATH = 'ios/build/BareExpo.app';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start
const NUM_OF_RETRIES = 6; // Number of retries for the suite

(async () => {
  try {
    const startMode = getStartMode(__filename);

    const projectRoot = path.resolve(__dirname, '..');
    const device = await queryDeviceIdAsync();
    if (!device) {
      throw new Error(`No iOS device found`);
    }

    const appBinaryPath = path.join(projectRoot, OUTPUT_APP_PATH);
    if (startMode === 'BUILD' || startMode === 'BUILD_AND_TEST') {
      const binaryPath = await buildAsync(projectRoot, device);
      await ensureDirAsync(path.dirname(appBinaryPath));
      await fs.cp(binaryPath, appBinaryPath, { recursive: true });
    }
    if (startMode === 'TEST' || startMode === 'BUILD_AND_TEST') {
      const maestroFlowFilePath = getMaestroFlowFilePath(projectRoot);
      await createMaestroFlowAsync({
        appId: APP_ID,
        workflowFile: maestroFlowFilePath,
        confirmFirstRunPrompt: true,
      });

      await retryAsync((retryNumber) => {
        console.log(`Test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
        return testAsync(maestroFlowFilePath, device.udid, appBinaryPath);
      }, NUM_OF_RETRIES);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

/**
 * @param {string} projectRoot
 * @param {{ udid: string, name: string }} device
 * @returns {Promise<string>}
 */
async function buildAsync(projectRoot, device) {
  console.log('\n💿 Building App');
  const buildOutput = await XcodeBuild.buildAsync({
    projectRoot,
    isSimulator: true,
    xcodeProject: {
      name: path.join(projectRoot, 'ios', 'BareExpo.xcworkspace'),
      isWorkspace: true,
    },
    device: {
      name: device.name,
      udid: device.udid,
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
 * @param {string} maestroFlowFilePath
 * @param {string} deviceId
 * @param {string} appBinaryPath
 * @returns {Promise<void>}
 */
async function testAsync(maestroFlowFilePath, deviceId, appBinaryPath) {
  try {
    await bootSimulatorAsync(deviceId);

    console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
    await spawnAsync('xcrun', ['simctl', 'install', deviceId, appBinaryPath], { stdio: 'inherit' });

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
