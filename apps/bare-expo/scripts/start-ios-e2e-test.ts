#!/usr/bin/env bun

import * as XcodeBuild from '@expo/cli/build/src/run/ios/XcodeBuild.js';
import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs/promises';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  createMaestroFlowAsync,
  ensureDirAsync,
  getStartMode,
  retryAsync,
  getMaestroFlowFilePath,
} from './lib/e2e-common';

const TARGET_DEVICE = 'iPhone 17 Pro';
const TARGET_DEVICE_IOS_VERSION = 26;
const APP_ID = 'dev.expo.Payments';
const OUTPUT_APP_PATH = 'ios/build/BareExpo.app';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start
const NUM_OF_RETRIES = 6;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      const maestroFlowFilePath = getMaestroFlowFilePath(projectRoot);
      await createMaestroFlowAsync({
        appId: APP_ID,
        workflowFile: maestroFlowFilePath,
        confirmFirstRunPrompt: true,
      });

      await retryAsync((retryNumber) => {
        console.log(`Test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
        return testAsync(maestroFlowFilePath, deviceId, appBinaryPath);
      }, NUM_OF_RETRIES);
    }
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

async function buildAsync(projectRoot: string, deviceId: string): Promise<string> {
  console.log('\n💿 Building App');
  // @ts-expect-error missing typings
  const buildOutput = await XcodeBuild.default.buildAsync({
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

  // @ts-expect-error missing typings
  const binaryPath = await XcodeBuild.default.getAppBinaryPath(buildOutput);
  return binaryPath;
}

function prettyPrintTestSuiteLogs(logs: string[]) {
  const lastTestSuiteLog = logs.reverse().find((logItem) => logItem.includes('TEST-SUITE-END'));
  if (!lastTestSuiteLog) {
    return '';
  }
  const jsonPart = lastTestSuiteLog?.match(/{.*}/);
  if (!jsonPart || !jsonPart[0]) {
    return '';
  }
  const testSuiteResult = JSON.parse(jsonPart[0]);
  if ((testSuiteResult?.failures.length ?? 0) <= 0) {
    return '';
  }
  const result = [];
  result.push('  ❌ Test suite had following test failures:');
  testSuiteResult?.failures?.split('\n').forEach((failure) => {
    if (failure.length > 0) {
      result.push(`    ${failure}`);
    }
  });
  return result.join('\n');
}

function prettyPrintNativeErrorLogs(logs: string[]) {
  // the output shape is always: actual logs, some unrelated stuff from simctrl
  return logs.slice(0, -1).join('\n');
}

async function isAppRunning() {
  const { output } = await spawnAsync('xcrun', ['simctl', 'spawn', 'booted', 'launchctl', 'list']);
  return output.find((line) => line.includes(APP_ID));
}

export function setupLogger(predicate: string, signal: AbortSignal): () => Promise<string[]> {
  const loggerProcess = spawnAsync('xcrun', [
    'simctl',
    'spawn',
    'booted',
    'log',
    'stream',
    '--level',
    'debug',
    '--predicate',
    predicate,
  ]);

  // Kill process when aborted
  signal.addEventListener(
    'abort',
    async () => {
      if (loggerProcess.child) {
        loggerProcess.child.kill('SIGTERM');
      }
      try {
        await loggerProcess;
      } catch {}
    },
    { once: true }
  );

  return async () => {
    try {
      const { output } = await loggerProcess;
      return output;
    } catch (error) {
      return error.output;
    }
  };
}

async function testAsync(
  maestroFlowFilePath: string,
  deviceId: string,
  appBinaryPath: string
): Promise<void> {
  const stopLogCollectionController = new AbortController();

  try {
    console.log(`\n📱 Starting Device - name[${TARGET_DEVICE}] udid[${deviceId}]`);
    await spawnAsync('xcrun', ['simctl', 'bootstatus', deviceId, '-b'], { stdio: 'inherit' });
    await spawnAsync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', deviceId], {
      stdio: 'inherit',
    });

    console.log(`\n🔌 Installing App - deviceId[${deviceId}] appBinaryPath[${appBinaryPath}]`);
    await spawnAsync('xcrun', ['simctl', 'install', deviceId, appBinaryPath], { stdio: 'inherit' });

    const getTestSuiteLogs = setupLogger(
      '(subsystem == "com.facebook.react.log")',
      stopLogCollectionController.signal
    );
    const getNativeErrorLogs = setupLogger(
      '(process == "BareExpo" AND (messageType == "error" OR messageType == "fault"))',
      stopLogCollectionController.signal
    );

    console.log(`\n📷 Starting Maestro tests - maestroFlowFilePath[${maestroFlowFilePath}]`);
    try {
      await spawnAsync('maestro', ['--device', deviceId, 'test', maestroFlowFilePath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          MAESTRO_DRIVER_STARTUP_TIMEOUT,
        },
      });
    } catch {
      stopLogCollectionController.abort();
      console.warn(`\n⚠️ Maestro flow failed, because:\n\n`);
      console.log(prettyPrintTestSuiteLogs(await getTestSuiteLogs()));
      // we need to always get these logs since it stops listener process
      const nativeLogs = await getNativeErrorLogs();
      if (!(await isAppRunning())) {
        console.warn(
          '\n\n  ❌ The runner app has probably crashed, here are the recent native error logs:\n\n'
        );
        console.log(prettyPrintNativeErrorLogs(nativeLogs));
      }

      console.log('\n\n');
      throw new Error('e2e tests have failed.');
    }
  } finally {
    stopLogCollectionController.abort();
    await spawnAsync('xcrun', ['simctl', 'shutdown', deviceId], { stdio: 'inherit' });
  }
}

async function queryDeviceIdAsync(iosVersion: number, device: string): Promise<string | null> {
  const { stdout } = await spawnAsync('xcrun', [
    'simctl',
    'list',
    'devices',
    'iPhone',
    'available',
    '--json',
  ]);
  const {
    devices: deviceWithRuntimes,
  }: { devices: Record<string, { name: string; udid: string }[]> } = JSON.parse(stdout);

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
