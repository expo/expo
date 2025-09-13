#!/usr/bin/env bun

import spawnAsync from '@expo/spawn-async';
import assert from 'node:assert';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  createMaestroFlowAsync,
  fileExistsAsync,
  getStartMode,
  retryAsync,
  getMaestroFlowFilePath,
} from './lib/e2e-common';

const APP_ID = 'dev.expo.payments';
const OUTPUT_APP_PATH = 'android/app/build/outputs/apk/release/app-release.apk';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start
const NUM_OF_RETRIES = 6; // Number of retries for the suite

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        throw new Error(
          `No connected Android device found. In CI, it should be started via the 'Use Android Emulator' action.`
        );
      }
      await testAsync(
        path.join(projectRoot, 'e2e/video-e2e.yaml'),
        deviceId,
        appBinaryPath,
        adbPath
      );
      // const maestroFlowFilePath = getMaestroFlowFilePath(projectRoot);
      // await createMaestroFlowAsync({
      //   appId: APP_ID,
      //   workflowFile: maestroFlowFilePath,
      //   confirmFirstRunPrompt: true,
      // });
      //
      // await retryAsync((retryNumber) => {
      //   console.log(`Test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
      //   return testAsync(maestroFlowFilePath, deviceId, appBinaryPath, adbPath);
      // }, NUM_OF_RETRIES);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

async function buildAsync(projectRoot: string): Promise<void> {
  console.log('\n💿 Building App');
  await spawnAsync('./gradlew', ['assembleRelease'], {
    stdio: 'inherit',
    cwd: path.join(projectRoot, 'android'),
  });
}

async function testAsync(
  maestroFlowFilePath: string,
  deviceId: string,
  appBinaryPath: string,
  adbPath: string
): Promise<void> {
  console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
  await spawnAsync(adbPath, ['-s', deviceId, 'install', '-r', appBinaryPath]);

  console.log(
    `\n📷 Starting Maestro tests - deviceId[${deviceId}] maestroFlowFilePath[${maestroFlowFilePath}]`
  );
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
