#!/usr/bin/env yarn --silent ts-node --transpile-only

import * as XcodeBuild from '@expo/cli/build/src/run/ios/XcodeBuild';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

import { createMaestroFlowAsync, ensureDirAsync, getStartMode, retryAsync } from './lib/e2e-common';

const TARGET_DEVICE = 'iPhone 16 Pro';
const TARGET_DEVICE_IOS_VERSION = 18;
const APP_ID = 'dev.expo.Payments';
const MAESTRO_GENERATED_FLOW = 'e2e/maestro-generated.yaml';
const OUTPUT_APP_PATH = 'ios/build/BareExpo.app';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start

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
      await retryAsync(() => testAsync(projectRoot, deviceId, appBinaryPath), 6);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

async function buildAsync(projectRoot: string, deviceId: string): Promise<string> {
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

async function testAsync(
  projectRoot: string,
  deviceId: string,
  appBinaryPath: string
): Promise<void> {
  try {
    console.log(`\n📱 Starting Device - name[${TARGET_DEVICE}] udid[${deviceId}]`);
    await spawnAsync('xcrun', ['simctl', 'bootstatus', deviceId, '-b'], { stdio: 'inherit' });
    await spawnAsync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', deviceId], {
      stdio: 'inherit',
    });

    console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
    await spawnAsync('xcrun', ['simctl', 'install', deviceId, appBinaryPath], { stdio: 'inherit' });

    const maestroFlowFilePath = path.join(projectRoot, MAESTRO_GENERATED_FLOW);
    await createMaestroFlowAsync({
      appId: APP_ID,
      workflowFile: maestroFlowFilePath,
      confirmFirstRunPrompt: true,
    });
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
 */
async function queryDeviceIdAsync(iosVersion: number, device: string): Promise<string | null> {
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
  for (const [runtime, devices] of Object.entries<{ name: string; udid: string }[]>(
    deviceWithRuntimes
  )) {
    if (runtime.startsWith(`com.apple.CoreSimulator.SimRuntime.iOS-${iosVersion}-`)) {
      for (const { name, udid } of devices) {
        if (name === device) {
          return udid;
        }
      }
    }
  }

  // Fallback to the first available device
  const firstEntry = Object.entries<{ name: string; udid: string }[]>(deviceWithRuntimes).find(
    ([runtime, devices]) => devices.length > 0
  );
  return firstEntry?.[1][0]?.udid ?? null;
}
