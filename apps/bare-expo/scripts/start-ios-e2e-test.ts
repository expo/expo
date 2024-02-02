#!/usr/bin/env yarn --silent ts-node --transpile-only

import * as XcodeBuild from '@expo/cli/build/src/run/ios/XcodeBuild';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

const TARGET_DEVICE = 'iPhone 15';
const TARGET_DEVICE_IOS_VERSION = 17;
const MAESTRO_GENERATED_FLOW = 'e2e/maestro-generated.yaml';
const OUTPUT_APP_PATH = 'ios/build/Bare Expo.app';
const MAESTRO_DRIVER_STARTUP_TIMEOUT = '120000'; // Wait 2 minutes for Maestro driver to start

enum StartMode {
  BUILD,
  TEST,
  BUILD_AND_TEST,
}

(async () => {
  try {
    const startMode = getStartMode();

    const projectRoot = path.resolve(__dirname, '..');
    const deviceId = await queryDeviceIdAsync(TARGET_DEVICE);
    if (!deviceId) {
      throw new Error(`Device not found: ${TARGET_DEVICE}`);
    }

    const appBinaryPath = path.join(projectRoot, OUTPUT_APP_PATH);
    if (startMode === StartMode.BUILD || startMode === StartMode.BUILD_AND_TEST) {
      const binaryPath = await buildAsync(projectRoot, deviceId);
      await ensureDirAsync(path.dirname(appBinaryPath));
      await fs.cp(binaryPath, appBinaryPath, { recursive: true });
    }
    if (startMode === StartMode.TEST || startMode === StartMode.BUILD_AND_TEST) {
      await retryAsync(() => testAsync(projectRoot, deviceId, appBinaryPath), 3);
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
    await createMaestroFlowAsync(projectRoot, maestroFlowFilePath);
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

async function retryAsync<T>(
  fn: () => Promise<T>,
  retries: number,
  delayAfterErrorMs: number = 5000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; ++i) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      await delayAsync(delayAfterErrorMs);
    }
  }
  throw lastError;
}

async function delayAsync(timeMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

/**
 * Query simulator UDID
 */
async function queryDeviceIdAsync(device: string): Promise<string | null> {
  const { stdout } = await spawnAsync('xcrun', [
    'simctl',
    'list',
    'devices',
    'available',
    '--json',
  ]);
  const { devices: deviceWithRuntimes } = JSON.parse(stdout);
  for (const [runtime, devices] of Object.entries<{ name: string; udid: string }[]>(
    deviceWithRuntimes
  )) {
    if (
      !runtime.startsWith(`com.apple.CoreSimulator.SimRuntime.iOS-${TARGET_DEVICE_IOS_VERSION}-`)
    ) {
      continue;
    }
    for (const { name, udid } of devices) {
      if (name === device) {
        return udid;
      }
    }
  }
  return null;
}

// Inject the `describe()` to current context and prevent loading **TestSuite-test.native.js** error
// @ts-expect-error
globalThis.describe = () => {};

/**
 * Generate Maestro flow yaml file
 */
async function createMaestroFlowAsync(projectRoot: string, outputFile: string): Promise<void> {
  const inputFile = require('../e2e/TestSuite-test.native.js');
  const testCases = inputFile.TESTS;
  const contents = [
    `\
appId: dev.expo.Payments
---
- clearState
# Run once to approve the first time deeplinking prompt
- openLink: bareexpo://test-suite/run
- tapOn:
    text: "Open"
    optional: true
`,
  ];

  for (const testCase of testCases) {
    contents.push(`\
- stopApp
- openLink: bareexpo://test-suite/run?tests=${testCase}
- extendedWaitUntil:
    visible:
      id: "test_suite_container"
    timeout: 30000
- scrollUntilVisible:
    element:
      id: "test_suite_text_results"
    direction: DOWN
- assertVisible:
    text: "Complete: 0 tests failed."
`);

    await fs.writeFile(outputFile, contents.join('\n'));
  }
}

function getStartMode(): StartMode {
  const programIndex = process.argv.findIndex((argv) => argv === __filename);
  const startModeArg = process.argv[programIndex + 1];
  if (startModeArg === '--build') {
    return StartMode.BUILD;
  }
  if (startModeArg === '--test') {
    return StartMode.TEST;
  }
  return StartMode.BUILD_AND_TEST;
}

async function ensureDirAsync(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}
