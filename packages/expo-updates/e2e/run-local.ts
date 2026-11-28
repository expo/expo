#!/usr/bin/env pnpm --silent ts-node --transpile-only

import spawnAsync from '@expo/spawn-async';
import { existsSync, realpathSync } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { syncE2EFixturesAsync } from './setup/project';

type Platform = 'ios' | 'android';
type Config = 'debug' | 'release';

type SuiteSpec = {
  setupScript: string;
  maestroFile: string;
  defaultConfig: Config;
  bundles: string[];
  appJsFileName?: string;
  includeFingerprintIgnore?: boolean;
};

const SUITES: Record<string, SuiteSpec> = {
  enabled: {
    setupScript: 'create-eas-project.ts',
    maestroFile: 'updates-e2e-enabled.yml',
    defaultConfig: 'debug',
    bundles: [],
  },
  'custom-init': {
    setupScript: 'create-eas-project-custom-init.ts',
    maestroFile: 'updates-e2e-custom-init.yml',
    defaultConfig: 'debug',
    bundles: ['test-update-1', 'test-update-2'],
  },
  startup: {
    setupScript: 'create-startup-eas-project.ts',
    maestroFile: 'updates-e2e-startup.yml',
    defaultConfig: 'debug',
    bundles: ['test-update-1', 'test-update-crashing'],
  },
  'error-recovery': {
    setupScript: 'create-startup-eas-project.ts',
    maestroFile: 'updates-e2e-error-recovery.yml',
    defaultConfig: 'release',
    bundles: ['test-update-1', 'test-update-crashing'],
  },
  fingerprint: {
    setupScript: 'create-fingerprint-eas-project.ts',
    maestroFile: 'updates-e2e-fingerprint.yml',
    defaultConfig: 'release',
    bundles: ['test-update-1'],
    includeFingerprintIgnore: true,
  },
  disabled: {
    setupScript: 'create-disabled-eas-project.ts',
    maestroFile: 'updates-e2e-disabled.yml',
    defaultConfig: 'debug',
    bundles: ['test-update-1'],
    appJsFileName: 'App-updates-disabled.tsx',
  },
  'bricking-measures-disabled': {
    setupScript: 'create-bricking-measures-disabled-eas-project.ts',
    maestroFile: 'updates-e2e-bricking-measures-disabled.yml',
    defaultConfig: 'release',
    bundles: ['test-update-1'],
  },
  'dev-client': {
    setupScript: 'create-dev-client-eas-project.ts',
    maestroFile: 'updates-e2e-dev-client.yml',
    defaultConfig: 'debug',
    bundles: ['test-update-1'],
  },
};

function printUsage() {
  console.log(`Usage: ./packages/expo-updates/e2e/run-local.ts --platform <ios|android> [options]

Options:
  --platform <ios|android>   Target platform (auto-detected if only one device is running)
  --suite <name>             Suite: ${Object.keys(SUITES).join(', ')} (default: enabled)
  --flow <file.yml>          Run a single Maestro flow instead of the full suite
  --config <debug|release>   Build configuration (default depends on suite)
  --dir <path>               Project directory (default: $TMPDIR/expo-updates-e2e/<suite>/updates-e2e)
  --port <port>              Updates test server port (default: 4747)
  --clean                    Recreate the E2E project from scratch
  --cleanup                  Delete the E2E project directory after the run finishes
  --pod-install              Force pod install on iOS when reusing an existing project
  --rebuild-bundles          Force regenerating update bundles
  --skip-bundles             Skip generating update bundles
  --skip-build               Skip native build (sync fixtures and run Maestro only)
  -h, --help                 Show this help`);
}

function parseArgs(argv: string[]) {
  const opts: {
    platform?: Platform;
    suite: string;
    flow?: string;
    config?: Config;
    dir?: string;
    port: string;
    clean: boolean;
    cleanup: boolean;
    podInstall: boolean;
    rebuildBundles: boolean;
    skipBundles: boolean;
    skipBuild: boolean;
  } = {
    suite: 'enabled',
    port: process.env.UPDATES_PORT || '4747',
    clean: false,
    cleanup: false,
    podInstall: false,
    rebuildBundles: false,
    skipBundles: false,
    skipBuild: false,
  };

  const nextValue = (flag: string, idx: number): string => {
    const val = argv[idx];
    if (val === undefined) {
      throw new Error(`Missing value for ${flag}`);
    }
    return val;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
      case '--platform':
      case '-p':
        opts.platform = nextValue(arg, ++i) as Platform;
        break;
      case '--suite':
      case '-s':
        opts.suite = nextValue(arg, ++i);
        break;
      case '--flow':
      case '-f':
        opts.flow = nextValue(arg, ++i);
        break;
      case '--config':
      case '-c':
        opts.config = nextValue(arg, ++i) as Config;
        break;
      case '--dir':
        opts.dir = path.resolve(nextValue(arg, ++i));
        break;
      case '--port':
        opts.port = nextValue(arg, ++i);
        break;
      case '--clean':
        opts.clean = true;
        break;
      case '--cleanup':
        opts.cleanup = true;
        break;
      case '--pod-install':
        opts.podInstall = true;
        break;
      case '--rebuild-bundles':
        opts.rebuildBundles = true;
        break;
      case '--skip-bundles':
        opts.skipBundles = true;
        break;
      case '--skip-build':
        opts.skipBuild = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

async function detectPlatformAsync(): Promise<Platform> {
  let hasIos = false;
  let hasAndroid = false;
  try {
    const res = await spawnAsync('xcrun', ['simctl', 'list', 'devices', 'booted']);
    hasIos = /\(Booted\)/.test(res.stdout);
  } catch {
    // xcrun unavailable on Linux
  }
  try {
    const res = await spawnAsync('adb', ['devices']);
    hasAndroid = res.stdout
      .split('\n')
      .slice(1)
      .some((line) => /\tdevice\s*$/.test(line));
  } catch {
    // adb unavailable
  }
  if (hasIos && !hasAndroid) return 'ios';
  if (hasAndroid && !hasIos) return 'android';
  throw new Error(
    hasIos && hasAndroid
      ? 'Both an iOS simulator and an Android device are running. Pass --platform ios or --platform android.'
      : 'No booted iOS simulator or Android emulator detected. Start one and pass --platform ios or --platform android.'
  );
}

async function detectAndroidAbiAsync(): Promise<string> {
  try {
    const res = await spawnAsync('adb', ['shell', 'getprop', 'ro.product.cpu.abi']);
    const abi = res.stdout.trim();
    if (abi) return abi;
  } catch {
    // fall back to host arch
  }
  return os.arch() === 'arm64' ? 'arm64-v8a' : 'x86_64';
}

async function hasBundlesForPlatformAsync(
  projectRoot: string,
  platform: Platform
): Promise<boolean> {
  const jsonPath = path.join(projectRoot, 'test-update-bundles', 'test-updates.json');
  if (!existsSync(jsonPath)) return false;
  try {
    const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
    return Object.values(data).some((entry: any) => Boolean(entry?.[platform]));
  } catch {
    return false;
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const suiteSpec = SUITES[opts.suite];
  if (!suiteSpec) {
    throw new Error(
      `Unknown suite "${opts.suite}". Valid suites: ${Object.keys(SUITES).join(', ')}`
    );
  }

  const platform = opts.platform ?? (await detectPlatformAsync());
  if (platform !== 'ios' && platform !== 'android') {
    throw new Error(`Invalid platform "${platform}". Expected "ios" or "android".`);
  }

  const config = opts.config ?? suiteSpec.defaultConfig;
  if (config !== 'debug' && config !== 'release') {
    throw new Error(`Invalid config "${config}". Expected "debug" or "release".`);
  }

  const repoRoot = path.resolve(__dirname, '../../..');
  // Basename must be `updates-e2e` so prebuild generates `updatese2e.xcworkspace` / `updatese2e.app`.
  const projectRoot =
    opts.dir ?? path.join(realpathSync(os.tmpdir()), 'expo-updates-e2e', opts.suite, 'updates-e2e');

  try {
    await runAsync({ opts, suiteSpec, platform, config, repoRoot, projectRoot });
  } finally {
    if (opts.cleanup) {
      console.log(`Cleaning up ${projectRoot}...`);
      await fs.rm(projectRoot, { recursive: true, force: true });
    }
  }
}

async function runAsync({
  opts,
  suiteSpec,
  platform,
  config,
  repoRoot,
  projectRoot,
}: {
  opts: ReturnType<typeof parseArgs>;
  suiteSpec: SuiteSpec;
  platform: Platform;
  config: Config;
  repoRoot: string;
  projectRoot: string;
}) {
  process.env.EXPO_REPO_ROOT = repoRoot;
  process.env.TEST_PROJECT_ROOT = projectRoot;
  process.env.UPDATES_HOST = process.env.UPDATES_HOST || 'localhost';
  process.env.UPDATES_PORT = opts.port;
  process.env.EXPO_PUBLIC_UPDATES_SERVER_PORT = opts.port;
  process.env.UPDATES_E2E_PLATFORM = platform;

  const needsCreate =
    opts.clean ||
    !existsSync(projectRoot) ||
    !existsSync(path.join(projectRoot, 'package.json')) ||
    !existsSync(path.join(projectRoot, platform));

  if (needsCreate) {
    console.log(`Creating updates E2E project (${opts.suite}, ${platform}) at ${projectRoot}...`);
    await fs.mkdir(path.dirname(projectRoot), { recursive: true });
    await spawnAsync(
      'pnpm',
      [
        '--silent',
        'ts-node',
        '--transpile-only',
        path.join(__dirname, 'setup', suiteSpec.setupScript),
      ],
      { cwd: repoRoot, stdio: 'inherit', env: process.env }
    );
  } else {
    console.log(`Reusing existing project at ${projectRoot} — syncing fixtures in-place...`);
    await syncE2EFixturesAsync(projectRoot, {
      appJsFileName: suiteSpec.appJsFileName,
      includeFingerprintIgnore: suiteSpec.includeFingerprintIgnore,
    });
  }

  const envFile = path.join(projectRoot, '.env');
  await fs.writeFile(envFile, `EXPO_PUBLIC_UPDATES_SERVER_PORT=${opts.port}\n`, 'utf-8');

  const bundlesExist = await hasBundlesForPlatformAsync(projectRoot, platform);
  if (!opts.skipBundles && (opts.rebuildBundles || needsCreate || !bundlesExist)) {
    const bundleArgs = ['run', 'generate-test-update-bundles', platform, ...suiteSpec.bundles];
    console.log(`Generating update bundles: pnpm ${bundleArgs.join(' ')}`);
    await spawnAsync('pnpm', bundleArgs, { cwd: projectRoot, stdio: 'inherit', env: process.env });
  } else {
    console.log('Reusing existing update bundles (pass --rebuild-bundles to regenerate).');
  }

  if (!opts.skipBuild) {
    if (platform === 'ios') {
      if (needsCreate || opts.podInstall || !existsSync(path.join(projectRoot, 'ios', 'Pods'))) {
        console.log('Running pod install (with prebuilt RN frameworks)...');
        await spawnAsync('pod', ['install'], {
          cwd: path.join(projectRoot, 'ios'),
          stdio: 'inherit',
          env: {
            ...process.env,
            RCT_USE_PREBUILT_RNCORE: '1',
            RCT_USE_RN_DEP: '1',
            USE_CCACHE: process.env.USE_CCACHE ?? '1',
          },
        });
      }
      console.log(`Building iOS app (${config})...`);
      await spawnAsync('pnpm', ['run', `maestro:ios:${config}:build`], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env,
      });
    } else {
      const abi =
        process.env.ORG_GRADLE_PROJECT_reactNativeArchitectures || (await detectAndroidAbiAsync());
      console.log(`Building Android app (${config}, ABI=${abi})...`);
      await spawnAsync('pnpm', ['run', `maestro:android:${config}:build`], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          ORG_GRADLE_PROJECT_reactNativeArchitectures: abi,
          GRADLE_OPTS:
            process.env.GRADLE_OPTS ||
            '-Dorg.gradle.jvmargs="-Xmx4096m -XX:MaxMetaspaceSize=4096m"',
        },
      });
    }
  } else {
    console.log('Skipping native build (--skip-build).');
  }

  const targetFlow = opts.flow
    ? opts.flow.startsWith('./') || opts.flow.startsWith('/')
      ? opts.flow
      : `./maestro/tests/${opts.flow}`
    : `./maestro/tests/${suiteSpec.maestroFile}`;

  console.log(`Running Maestro: ${targetFlow} (${platform}, ${config})`);
  await spawnAsync('./maestro/maestro-test-executor.sh', [targetFlow, platform, config], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
