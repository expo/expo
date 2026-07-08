#!/usr/bin/env bun

// TODO: Remove this import, please don't use internals
import * as XcodeBuild from '@expo/cli/build/src/run/ios/XcodeBuild.js';
import spawnAsync from '@expo/spawn-async';
import * as fs from 'fs/promises';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  annotate,
  createMaestroFlowAsync,
  ensureDirAsync,
  getStartMode,
  retryAsync,
  prettyPrintTestSuiteLogs,
  printImageComparisonServerLogs,
  runCustomMaestroFlowsAsync,
  runMaestroAsync,
  TEST_DURATION_LABEL,
  startGroup,
  endGroup,
} from './lib/e2e-common';
import { getDylibPath } from '../e2e/image-comparison/inspector/ScreenInspectorIOS';

const TARGET_DEVICE = 'iPhone 17 Pro';
const TARGET_DEVICE_IOS_VERSION = 26;
const APP_ID = 'dev.expo.Payments';
const OUTPUT_APP_PATH = 'ios/build/BareExpo.app';
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
      const e2eDir = path.join(projectRoot, 'e2e');

      // The simulator, the app and the maestro driver survive across maestro invocations,
      // so set everything up only once instead of paying for it on every flow and retry.
      await startSimulatorAsync(deviceId);
      await preApproveDeepLinkPromptAsync(deviceId);
      await installAppAsync(deviceId, appBinaryPath);

      if (process.env.CI) {
        // Approve the first-run deep link confirmation prompt before the actual flows (when
        // running locally, we assume the app can already open without confirmation). This flow
        // stops and relaunches the app, so it must run before the inspector launch below;
        // otherwise the relaunched app would lose the injected dylib and every viewshot lookup
        // would time out.
        const confirmFlow = '_nested-flows/confirm-app-open.yaml';
        await retryAsync(async () => {
          const failedFlows = await testAsync([confirmFlow], deviceId, e2eDir);
          if (failedFlows.length > 0) {
            throw new Error('Failed to approve the deep link confirmation prompt.');
          }
        }, 2);
      }

      await launchAppWithInspectorAsync(deviceId);

      await runCustomMaestroFlowsAsync(e2eDir, 'ios', async (flowRelativePaths, { attempt }) => {
        if (attempt > 1) {
          // Relaunch to reset any app state left over by the failed flows (e.g. a video stuck
          // in fullscreen) and to restore the inspector dylib in case the app crashed.
          await launchAppWithInspectorAsync(deviceId);
        }
        return await testAsync(flowRelativePaths, deviceId, e2eDir);
      });

      const maestroNativeModulesFlowFilePath = await createMaestroFlowAsync({
        appId: APP_ID,
        e2eDir,
      });
      const nativeModulesFlowRelativePath = path.relative(e2eDir, maestroNativeModulesFlowFilePath);

      await retryAsync(async (retryNumber) => {
        console.log(`Native modules test suite attempt ${retryNumber + 1} of ${NUM_OF_RETRIES}`);
        const failedFlows = await testAsync([nativeModulesFlowRelativePath], deviceId, e2eDir);
        if (failedFlows.length > 0) {
          annotate(
            retryNumber + 1 >= NUM_OF_RETRIES ? 'error' : 'warning',
            'Native modules test suite failed',
            `attempt ${retryNumber + 1} of ${NUM_OF_RETRIES} failed`
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

async function startSimulatorAsync(deviceId: string, timeout: number = 180_000) {
  await retryAsync(async (retryNumber) => {
    if (process.env.CI && retryNumber > 0) {
      try {
        await spawnAsync('xcrun', ['simctl', 'shutdown', deviceId], { stdio: 'inherit' });
        await spawnAsync('xcrun', ['simctl', 'erase', deviceId], { stdio: 'inherit' });
      } catch {}
    }

    console.log(
      `\n📱 Starting Device - name[${TARGET_DEVICE}] udid[${deviceId}] retry[${retryNumber}]`
    );
    const label = 'device startup duration';
    console.time(label);
    // Capture (don't inherit) stdio so the verbose boot/data-migration progress doesn't flood the logs.
    const bootProc = spawnAsync('xcrun', ['simctl', 'bootstatus', deviceId, '-b']);

    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        bootProc.child?.kill('SIGTERM');
        reject(new Error('Timeout from booting up simulator'));
      }, timeout);
    });

    await Promise.race([bootProc, timeoutPromise]);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }

    if (!process.env.CI) {
      await spawnAsync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', deviceId], {
        stdio: 'inherit',
      });
    }
    clearTimeout(timeoutHandle);
    console.timeEnd(label);
  }, 3);
}

async function preApproveDeepLinkPromptAsync(deviceId: string): Promise<void> {
  // Approve the bareexpo:// scheme in the simulator's LaunchServices store so the "Open in
  // BareExpo?" prompt never shows up; unlike a tapped approval it also survives clearState.
  console.log('\n🔓 Pre-approving the deep link confirmation prompt');
  await spawnAsync('xcrun', [
    'simctl',
    'spawn',
    deviceId,
    'defaults',
    'write',
    'com.apple.launchservices.schemeapproval',
    'com.apple.CoreSimulator.CoreSimulatorBridge-->bareexpo',
    '-string',
    APP_ID,
  ]);
}

async function installAppAsync(deviceId: string, appBinaryPath: string): Promise<void> {
  console.log(`\n🔌 Installing App - deviceId[${deviceId}] appBinaryPath[${appBinaryPath}]`);
  await spawnAsync('xcrun', ['simctl', 'install', deviceId, appBinaryPath], { stdio: 'inherit' });
}

async function launchAppWithInspectorAsync(deviceId: string): Promise<void> {
  const dylibPath = getDylibPath();
  console.log(`\n💉 Launching app with dylib injected - dylibPath[${dylibPath}]`);

  try {
    // The dylib is only injected at launch time, so make sure the app isn't already running.
    await spawnAsync('xcrun', ['simctl', 'terminate', deviceId, APP_ID], { stdio: 'pipe' });
  } catch {
    // The app might not be running, which is fine.
  }

  try {
    await spawnAsync('xcrun', ['simctl', 'launch', deviceId, APP_ID], {
      stdio: 'inherit',
      env: {
        ...process.env,
        SIMCTL_CHILD_DYLD_INSERT_LIBRARIES: dylibPath,
      },
    });
  } catch (error: any) {
    console.warn('⚠️  App launch with dylib failed:', error.message);
  }
}

// The maestro driver only needs to be installed by the first invocation; later invocations
// reuse it, which saves about a minute each.
let reinstallMaestroDriver = true;

async function testAsync(
  flowRelativePaths: string[],
  deviceId: string,
  e2eDir: string
): Promise<string[]> {
  startGroup(flowRelativePaths.join(', '));
  const stopLogCollectionController = new AbortController();

  try {
    const getTestSuiteLogs = setupLogger(
      '(subsystem == "com.facebook.react.log")',
      stopLogCollectionController.signal
    );
    const getNativeErrorLogs = setupLogger(
      '(process == "BareExpo" AND (messageType == "error" OR messageType == "fault"))',
      stopLogCollectionController.signal
    );

    console.log(`\n📷 Starting Maestro tests - flows[${flowRelativePaths.join(', ')}]`);
    console.time(TEST_DURATION_LABEL);
    let failedFlows: string[];
    try {
      failedFlows = await runMaestroAsync({
        deviceArgs: ['--device', deviceId],
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

      console.log(prettyPrintTestSuiteLogs(await getTestSuiteLogs()));
      await printImageComparisonServerLogs();
      // we need to always get these logs since it stops listener process
      const nativeLogs = await getNativeErrorLogs();
      if (!(await isAppRunning())) {
        if (nativeLogs.length > 0) {
          console.warn(
            '\n\n  ❌ The runner app has probably crashed, here are the recent native error logs:\n\n'
          );
          console.log(prettyPrintNativeErrorLogs(nativeLogs));
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
