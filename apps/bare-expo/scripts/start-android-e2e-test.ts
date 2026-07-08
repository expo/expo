#!/usr/bin/env bun

import spawnAsync from '@expo/spawn-async';
import assert from 'node:assert';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  annotate,
  createMaestroFlowAsync,
  fileExistsAsync,
  getStartMode,
  retryAsync,
  prettyPrintTestSuiteLogs,
  printImageComparisonServerLogs,
  setupLogger,
  runCustomMaestroFlowsAsync,
  runMaestroAsync,
  TEST_DURATION_LABEL,
  startGroup,
  endGroup,
} from './lib/e2e-common';

const APP_ID = 'dev.expo.payments';
const OUTPUT_APP_PATH = 'android/app/build/outputs/apk/release/app-release.apk';
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
      const e2eDir = path.join(projectRoot, 'e2e');

      // The app and the maestro driver survive across maestro invocations, so install
      // everything only once instead of paying for it on every flow and retry.
      await installAppAsync(adbPath, deviceId, appBinaryPath);

      await runCustomMaestroFlowsAsync(
        e2eDir,
        'android',
        async (flowRelativePaths, { attempt }) => {
          if (attempt > 1) {
            // Stop the app to reset any state left over by the failed flows; the next
            // openLink launches it again.
            await forceStopAppAsync(adbPath, deviceId);
          }
          return await testAsync(flowRelativePaths, deviceId, adbPath, e2eDir);
        }
      );

      const maestroNativeModulesFlowFilePath = await createMaestroFlowAsync({
        appId: APP_ID,
        e2eDir,
      });
      const nativeModulesFlowRelativePath = path.relative(e2eDir, maestroNativeModulesFlowFilePath);

      await retryAsync(async (retryNumber) => {
        console.log(`Native modules test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
        const failedFlows = await testAsync(
          [nativeModulesFlowRelativePath],
          deviceId,
          adbPath,
          e2eDir
        );
        if (failedFlows.length > 0) {
          annotate(
            retryNumber + 1 >= NUM_OF_RETRIES ? 'error' : 'warning',
            'Native modules test suite failed',
            `attempt  of  failed`
          );
          throw new Error('Native modules test suite failed.');
        }
      }, NUM_OF_RETRIES);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

async function buildAsync(projectRoot: string): Promise<void> {
  console.log('\n💿 Building App');
  await spawnAsync(
    './gradlew',
    ['--build-cache', '--no-configuration-cache', ':app:assembleRelease'],
    {
      stdio: 'inherit',
      cwd: path.join(projectRoot, 'android'),
    }
  );
}

async function installAppAsync(
  adbPath: string,
  deviceId: string,
  appBinaryPath: string
): Promise<void> {
  console.log(`\n🔌 Installing App - appBinaryPath[${appBinaryPath}]`);
  await spawnAsync(adbPath, ['-s', deviceId, 'install', '-r', appBinaryPath]);
}

async function forceStopAppAsync(adbPath: string, deviceId: string): Promise<void> {
  await spawnAsync(adbPath, ['-s', deviceId, 'shell', 'am', 'force-stop', APP_ID]);
}

// The maestro driver only needs to be installed by the first invocation; later invocations
// reuse it, which saves about a minute each.
let reinstallMaestroDriver = true;

async function testAsync(
  flowRelativePaths: string[],
  deviceId: string,
  adbPath: string,
  e2eDir: string
): Promise<string[]> {
  startGroup(flowRelativePaths.join(', '));
  const stopLogCollectionController = new AbortController();

  console.log(
    `\n📷 Starting Maestro tests - deviceId[${deviceId}] flows[${flowRelativePaths.join(', ')}]`
  );
  const getLogs = setupLogger(`adb logcat -e ${APP_ID}`, stopLogCollectionController.signal);
  try {
    console.time(TEST_DURATION_LABEL);
    let failedFlows: string[];
    try {
      failedFlows = await runMaestroAsync({
        deviceArgs: ['--platform', 'android'],
        flowRelativePaths,
        e2eDir,
        reinstallDriver: reinstallMaestroDriver,
      });
    } finally {
      console.timeEnd(TEST_DURATION_LABEL);
    }
    reinstallMaestroDriver = false;

    if (failedFlows.length > 0) {
      stopLogCollectionController.abort();
      console.warn(`\n⚠️ Maestro flows failed: ${failedFlows.join(', ')}\n\n`);
      const logs = await getLogs();
      console.log(prettyPrintTestSuiteLogs(logs));
      await printImageComparisonServerLogs();
      if (!(await isAppRunning())) {
        if (logs.length > 0) {
          console.warn(
            '\n\n  ❌ The runner app has probably crashed, here are the recent native error logs:\n\n'
          );
          console.log(logs.slice(-30).join('\n'));
        } else {
          console.warn(
            '\n\n  ❌ The runner app has probably crashed, but no native logs were captured.\n\n'
          );
        }
      }
      console.log('\n\n');
    }
    return failedFlows;
  } finally {
    endGroup();
    stopLogCollectionController.abort();
  }
}

async function isAppRunning() {
  const adbPath = await findAdbAsync();
  try {
    await spawnAsync(adbPath, ['shell', 'pidof', APP_ID]);
    return true;
  } catch {
    return false;
  }
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
