#!/usr/bin/env -S yarn --silent ts-node --transpile-only

import spawnAsync from '@expo/spawn-async';
import assert from 'node:assert';
import path from 'path';

import {
  createMaestroFlowAsync,
  fileExistsAsync,
  getStartMode,
  retryAsync,
} from './lib/e2e-common';

const APP_ID = 'dev.expo.payments';
const MAESTRO_GENERATED_FLOW = 'e2e/maestro-generated.yaml';
const OUTPUT_APP_PATH = 'android/app/build/outputs/apk/release/app-release.apk';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start

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
      await retryAsync(() => testAsync(projectRoot, deviceId, appBinaryPath, adbPath), 6);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

async function buildAsync(projectRoot: string) {
  console.log('\n💿 Building App');
  await spawnAsync('./gradlew', ['assembleRelease'], {
    stdio: 'inherit',
    cwd: path.join(projectRoot, 'android'),
  });
}

async function testAsync(
  projectRoot: string,
  deviceId: string,
  appBinaryPath: string,
  adbPath: string
): Promise<void> {
  console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
  await spawnAsync(adbPath, ['-s', deviceId, 'install', '-r', appBinaryPath]);

  const maestroFlowFilePath = path.join(projectRoot, MAESTRO_GENERATED_FLOW);
  await createMaestroFlowAsync({
    appId: APP_ID,
    workflowFile: maestroFlowFilePath,
  });
  console.log(`\n📷 Starting Maestro tests - maestroFlowFilePath[${maestroFlowFilePath}]`);
  await spawnAsync('maestro', ['--platform', 'android', 'test', maestroFlowFilePath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      MAESTRO_DRIVER_STARTUP_TIMEOUT,
    },
  });
}

async function findAdbAsync(): Promise<string | null> {
  let adbPath: string | null = null;
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

async function queryDeviceIdAsync(adbPath: string): Promise<string | null> {
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
