import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

// Unit tests run against the bare-expo workspace — its Podfile links every package with
// `use_expo_modules!(includeTests: true)`, so CocoaPods autogenerates a shared
// `<PodName>-Unit-<TestSpecName>` scheme for each test spec. We invoke those schemes with
// `xcodebuild` directly: no Fastlane, no generated aggregate scheme, and the default
// derived data folder so local runs share build products with regular Xcode builds.
const BARE_EXPO_IOS_DIR = path.join(Directories.getAppsDir(), 'bare-expo', 'ios');
const WORKSPACE_PATH = path.join(BARE_EXPO_IOS_DIR, 'BareExpo.xcworkspace');
const RESULTS_DIR = '/tmp/ios-unit-tests-results';

// Computes the Xcode unit-test target names for a package by scanning every podspec it
// declares — a package like expo-modules-core ships several (ExpoModulesCore,
// ExpoModulesWorklets, …), each potentially with its own test specs. Each test spec becomes
// `<PodName>-Unit-<TestSpecName>`, named after the podspec that owns it (not the package's
// primary podspec), which is how CocoaPods generates the targets.
function getUnitTestTargets(pkg: Packages.Package): string[] {
  const targets: string[] = [];
  for (const podspecRelPath of pkg.podspecPaths) {
    const podspecAbsPath = path.join(pkg.path, podspecRelPath);
    if (!fs.existsSync(podspecAbsPath)) {
      continue;
    }
    const podName = path.basename(podspecRelPath, '.podspec');
    const contents = fs.readFileSync(podspecAbsPath, 'utf8');
    for (const match of contents.matchAll(/test_spec\s'([^']*)'/g)) {
      targets.push(`${podName}-Unit-${match[1]}`);
    }
  }
  return targets;
}

// CocoaPods writes a scheme for every test spec target during `pod install` — into the
// current user's `xcuserdata` by default, or `xcshareddata` when scheme sharing is enabled.
// `xcodebuild` sees both. Verifying them on disk up front (instead of letting `xcodebuild`
// fail one by one) catches missing/outdated `pod install` and pods whose test specs were
// dropped by autolinking (e.g. precompiled pods — see `should_include_test_specs?` in
// precompiled_modules.rb).
function assertSchemesExist(schemes: string[]) {
  const podsProjectDir = path.join(BARE_EXPO_IOS_DIR, 'Pods', 'Pods.xcodeproj');
  // Only the current user's schemes are visible to xcodebuild, so don't scan other users'.
  const schemesDirs = [
    path.join(podsProjectDir, 'xcshareddata', 'xcschemes'),
    path.join(podsProjectDir, 'xcuserdata', `${os.userInfo().username}.xcuserdatad`, 'xcschemes'),
  ];
  const missing = schemes.filter(
    (scheme) =>
      !schemesDirs.some((schemesDir) => fs.existsSync(path.join(schemesDir, `${scheme}.xcscheme`)))
  );
  if (missing.length > 0) {
    throw new Error(
      `Couldn't find test schemes in ${podsProjectDir}:\n- ${missing.join('\n- ')}\n` +
        `CocoaPods generates these schemes during \`pod install\`, so the pods in ` +
        `${BARE_EXPO_IOS_DIR} are probably missing or outdated — run \`pod install\` there ` +
        `and try again. If a scheme is still missing, its pod's test specs may have been ` +
        `dropped by autolinking because the pod is precompiled — see ` +
        `\`should_include_test_specs?\` in expo-modules-autolinking.`
    );
  }
}

type Simulator = {
  udid: string;
  name: string;
  state: string;
};

// Picks the simulator to test on: an already-booted iPhone if there is one, otherwise an
// iPhone from the newest available iOS runtime. Resolving to a concrete udid avoids
// device-name assumptions that break across Xcode versions and local machines.
async function findSimulatorDestinationAsync(): Promise<string> {
  const { stdout } = await spawnAsync('xcrun', [
    'simctl',
    'list',
    'devices',
    'available',
    '--json',
  ]);
  const { devices } = JSON.parse(stdout) as { devices: Record<string, Simulator[]> };

  const runtimeVersion = (runtime: string): number[] =>
    runtime
      .replace(/^.*SimRuntime\.iOS-/, '')
      .split('-')
      .map(Number);

  const iosRuntimes = Object.keys(devices)
    .filter((runtime) => runtime.includes('SimRuntime.iOS'))
    .sort((a, b) => {
      const [aMajor = 0, aMinor = 0] = runtimeVersion(a);
      const [bMajor = 0, bMinor = 0] = runtimeVersion(b);
      return bMajor - aMajor || bMinor - aMinor;
    });

  const iphones = iosRuntimes.flatMap(
    (runtime) => devices[runtime]?.filter((device) => device.name.includes('iPhone')) ?? []
  );
  const simulator = iphones.find((device) => device.state === 'Booted') ?? iphones[0];
  if (!simulator) {
    throw new Error(
      'No available iPhone simulator found — unit tests need one to run on. ' +
        'Install an iOS simulator runtime in Xcode (Settings → Components) and check ' +
        '`xcrun simctl list devices available`.'
    );
  }
  console.log(`Using simulator: ${simulator.name} (${simulator.udid})\n`);
  return `id=${simulator.udid}`;
}

async function isXcbeautifyAvailableAsync(): Promise<boolean> {
  try {
    await spawnAsync('which', ['xcbeautify']);
    return true;
  } catch {
    return false;
  }
}

// On GitHub Actions, use workflow commands to fold each target's output into a collapsible
// group and surface failures as annotations. https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

async function runTestsAsync(scheme: string, destination: string, useXcbeautify: boolean) {
  const args = [
    'test',
    '-workspace',
    WORKSPACE_PATH,
    '-scheme',
    scheme,
    '-configuration',
    'Debug',
    '-destination',
    destination,
    '-resultBundlePath',
    path.join(RESULTS_DIR, `${scheme}.xcresult`),
    'CODE_SIGN_IDENTITY=',
    'CODE_SIGNING_REQUIRED=NO',
  ];

  if (useXcbeautify) {
    // The github-actions renderer emits `::error`/`::warning` annotations with file and line
    // for compile errors and test failures.
    const xcbeautify = isGithubActions ? 'xcbeautify --renderer github-actions' : 'xcbeautify';
    // Pipe through xcbeautify while preserving xcodebuild's exit code.
    const command = ['xcodebuild', ...args].map((arg) => `'${arg}'`).join(' ');
    await spawnAsync('bash', ['-o', 'pipefail', '-c', `${command} 2>&1 | ${xcbeautify}`], {
      cwd: Directories.getExpoRepositoryRootDir(),
      stdio: 'inherit',
    });
  } else {
    await spawnAsync('xcodebuild', args, {
      cwd: Directories.getExpoRepositoryRootDir(),
      stdio: 'inherit',
    });
  }
}

export async function iosNativeUnitTests({ packages }: { packages?: string }) {
  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];

  const targetsToTest: string[] = [];
  const packagesToTest: string[] = [];
  for (const pkg of allPackages) {
    if (!pkg.podspecName || !pkg.podspecPath || !(await pkg.hasNativeTestsAsync('ios'))) {
      if (packageNamesFilter.includes(pkg.packageName)) {
        throw new Error(`The package ${pkg.packageName} does not include iOS unit tests.`);
      }
      continue;
    }

    if (packageNamesFilter.length > 0 && !packageNamesFilter.includes(pkg.packageName)) {
      continue;
    }

    const pkgTargets = getUnitTestTargets(pkg);
    if (!pkgTargets.length) {
      throw new Error(
        `Failed to test package ${pkg.packageName}: no test specs were found in its podspec file(s).`
      );
    }

    targetsToTest.push(...pkgTargets);
    packagesToTest.push(pkg.packageName);
  }

  if (packageNamesFilter.length && !targetsToTest.length) {
    throw new Error(
      `No packages were found with the specified names: ${packageNamesFilter.join(', ')}`
    );
  }

  assertSchemesExist(targetsToTest);

  // xcodebuild fails if a result bundle already exists at the given path.
  await fs.remove(RESULTS_DIR);

  const destination = await findSimulatorDestinationAsync();
  const useXcbeautify = await isXcbeautifyAvailableAsync();
  if (!useXcbeautify) {
    console.log(chalk.yellow('xcbeautify not found, falling back to raw xcodebuild output.\n'));
  }

  console.log(`Running tests for targets:\n- ${targetsToTest.join('\n- ')}\n`);

  // Schemes run sequentially within the same workspace, so they share derived data — the
  // heavy common dependencies build once and later schemes only build their own pods.
  const failedTargets: string[] = [];
  for (const target of targetsToTest) {
    if (isGithubActions) {
      console.log(`::group::🧪 ${target}`);
    } else {
      console.log(chalk.cyan.bold(`\n▶︎ ${target}\n`));
    }
    let failed = false;
    try {
      await runTestsAsync(target, destination, useXcbeautify);
    } catch {
      failed = true;
      failedTargets.push(target);
    }
    if (isGithubActions) {
      console.log('::endgroup::');
    }
    if (failed) {
      // Printed after `::endgroup::` so the failure stays visible when the group is collapsed.
      if (isGithubActions) {
        console.log(`::error title=iOS unit tests::Tests failed for target ${target}`);
      } else {
        console.error(chalk.red(`\n✖ Tests failed for target ${target}`));
      }
    }
  }

  if (failedTargets.length > 0) {
    throw new Error(`iOS unit tests failed for targets: ${failedTargets.join(', ')}`);
  }
  console.log('✅ All unit tests passed for the following packages:', packagesToTest.join(', '));
}

export default (program: any) => {
  program
    .command('ios-native-unit-tests')
    .option(
      '--packages <string>',
      '[optional] Comma-separated list of package names to run unit tests for. Defaults to all packages with unit tests.'
    )
    .description('Runs iOS native unit tests for each package that provides them.')
    .asyncAction(iosNativeUnitTests);
};
