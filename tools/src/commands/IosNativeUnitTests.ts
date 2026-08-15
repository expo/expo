import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { getAffectedPackagesAsync } from '../AffectedPackages';
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

const PODS_PROJECT_DIR = path.join(BARE_EXPO_IOS_DIR, 'Pods', 'Pods.xcodeproj');
const MERGED_SCHEME_NAME = 'ExpoUnitTests-generated';

// CocoaPods writes a scheme for every test spec target during `pod install` — into the
// current user's `xcuserdata` by default, or `xcshareddata` when scheme sharing is enabled.
// `xcodebuild` sees both. Resolving them on disk up front (instead of letting `xcodebuild`
// fail one by one) catches missing/outdated `pod install` and pods whose test specs were
// dropped by autolinking (e.g. precompiled pods — see `should_include_test_specs?` in
// precompiled_modules.rb).
function resolveSchemeFiles(schemes: string[]): Map<string, string> {
  // Only the current user's schemes are visible to xcodebuild, so don't scan other users'.
  const schemesDirs = [
    path.join(PODS_PROJECT_DIR, 'xcshareddata', 'xcschemes'),
    path.join(PODS_PROJECT_DIR, 'xcuserdata', `${os.userInfo().username}.xcuserdatad`, 'xcschemes'),
  ];
  const schemeFiles = new Map<string, string>();
  for (const scheme of schemes) {
    const schemeFile = schemesDirs
      .map((schemesDir) => path.join(schemesDir, `${scheme}.xcscheme`))
      .find((filePath) => fs.existsSync(filePath));
    if (schemeFile) {
      schemeFiles.set(scheme, schemeFile);
    }
  }
  const missing = schemes.filter((scheme) => !schemeFiles.has(scheme));
  if (missing.length > 0) {
    throw new Error(
      `Couldn't find test schemes in ${PODS_PROJECT_DIR}:\n- ${missing.join('\n- ')}\n` +
        `CocoaPods generates these schemes during \`pod install\`, so the pods in ` +
        `${BARE_EXPO_IOS_DIR} are probably missing or outdated — run \`pod install\` there ` +
        `and try again. If a scheme is still missing, its pod's test specs may have been ` +
        `dropped by autolinking because the pod is precompiled — see ` +
        `\`should_include_test_specs?\` in expo-modules-autolinking.`
    );
  }
  return schemeFiles;
}

// Merges the per-test-spec schemes into a single scheme so that all targets build and test
// in one `xcodebuild` invocation — one build graph and one test session instead of paying
// workspace loading and build-graph computation per target (~1 minute each on CI). The
// CocoaPods-generated schemes already contain the `<TestableReference>` blocks (with target
// UUIDs), so this just concatenates them — no Xcode project parsing needed.
// Testables are marked parallelizable so that Xcode distributes them across simulator
// clones instead of spawning a test runner per bundle sequentially (~15-20s each).
function generateMergedScheme(schemeFiles: Map<string, string>): string {
  const testables = [...schemeFiles.entries()]
    .map(([scheme, schemeFile]) => {
      const contents = fs.readFileSync(schemeFile, 'utf8');
      const match = contents.match(/<TestableReference[\s\S]*?<\/TestableReference>/);
      if (!match) {
        throw new Error(`No testable reference found in the scheme ${scheme} (${schemeFile})`);
      }
      return match[0].replace(
        '<TestableReference',
        '<TestableReference\n            parallelizable = "YES"'
      );
    })
    .join('\n         ');

  const mergedScheme = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1500" version="1.3">
   <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES">
   </BuildAction>
   <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES">
      <Testables>
         ${testables}
      </Testables>
   </TestAction>
</Scheme>
`;
  const mergedSchemePath = path.join(
    PODS_PROJECT_DIR,
    'xcshareddata',
    'xcschemes',
    `${MERGED_SCHEME_NAME}.xcscheme`
  );
  fs.outputFileSync(mergedSchemePath, mergedScheme);
  return MERGED_SCHEME_NAME;
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

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

// Changes to any of these paths affect how the tests themselves build and run, so
// affected-packages detection must fall back to testing everything — the infrastructure
// must not be able to skip its own validation. For `tools/`, only the modules this command
// is built from are listed (not the whole directory, which changes far too often).
const INFRA_PATH_PATTERNS = [
  /^tools\/src\/commands\/(IosNativeUnitTests|NativeUnitTests)\.ts$/,
  /^tools\/src\/(AffectedPackages|Packages|Directories|CocoaPods)\.ts$/,
  /^apps\/bare-expo\/ios\//,
  /^\.github\/workflows\/ios-unit-tests\.yml$/,
  /^packages\/expo-modules-autolinking\//,
  /^packages\/expo-module-scripts\//,
  /^packages\/expo-modules-test-core\//,
  /^pnpm-lock\.yaml$/,
  // CocoaPods and xcodeproj come from the bundle, so gem bumps change how pods install.
  /^Gemfile(\.lock)?$/,
];

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
    // Spread parallelizable testables across multiple simulator clones. Without an explicit
    // worker count, xcodebuild tends to stick to a single clone for this kind of load.
    '-parallel-testing-enabled',
    'YES',
    '-parallel-testing-worker-count',
    '3',
    '-resultBundlePath',
    path.join(RESULTS_DIR, `${scheme}.xcresult`),
    'CODE_SIGN_IDENTITY=',
    'CODE_SIGNING_REQUIRED=NO',
  ];
  const cwd = Directories.getExpoRepositoryRootDir();

  // Without NSUnbufferedIO, xcodebuild buffers its output when writing to a pipe, so test
  // results would show up in delayed bursts instead of streaming line by line.
  const env = { ...process.env, NSUnbufferedIO: 'YES' };

  if (useXcbeautify) {
    // The github-actions renderer emits `::error`/`::warning` annotations with file and line
    // for compile errors and test failures.
    const xcbeautify = isGithubActions ? 'xcbeautify --renderer github-actions' : 'xcbeautify';
    // Pipe through xcbeautify while preserving xcodebuild's exit code. Single quotes within
    // an argument (e.g. a repo path like /Users/O'Brien/…) must be escaped for the shell.
    const command =
      ['xcodebuild', ...args].map((arg) => `'${arg.replace(/'/g, `'\\''`)}'`).join(' ') +
      ` 2>&1 | ${xcbeautify}`;
    await spawnAsync('bash', ['-o', 'pipefail', '-c', command], { cwd, env, stdio: 'inherit' });
  } else {
    await spawnAsync('xcodebuild', args, { cwd, env, stdio: 'inherit' });
  }
}

export async function iosNativeUnitTests({
  packages,
  affected,
  since = 'main',
}: {
  packages?: string;
  affected?: boolean;
  since?: string;
}) {
  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];

  // An explicit `--packages` list takes precedence over affected-packages detection.
  let affectedFilter: Set<string> | null = null;
  if (affected && !packageNamesFilter.length) {
    try {
      const result = await getAffectedPackagesAsync({
        scmBase: since,
        infraPathPatterns: INFRA_PATH_PATTERNS,
      });
      if (result.type === 'infra-changed') {
        console.log(
          `Test infrastructure changed (${chalk.bold(result.changedFile)}) — running all iOS unit tests.\n`
        );
      } else {
        affectedFilter = result.packageNames;
        console.log(`Testing only packages affected since ${chalk.bold(since)}.\n`);
      }
    } catch (error: any) {
      // Fail open: when the detection itself breaks (e.g. the merge base is unreachable in
      // a shallow clone), running everything is always correct — just slower.
      console.log(
        chalk.yellow(
          `Couldn't determine affected packages (${error.message?.trim()}) — running all iOS unit tests.\n`
        )
      );
    }
  }

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
    if (affectedFilter && !affectedFilter.has(pkg.packageName)) {
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

  if (!targetsToTest.length) {
    if (packageNamesFilter.length) {
      throw new Error(
        `No packages were found with the specified names: ${packageNamesFilter.join(', ')}`
      );
    }
    if (affectedFilter) {
      console.log('✅ No affected packages provide iOS unit tests — nothing to run.');
      return;
    }
    // Without this guard, an empty target list would generate a scheme with no testables and
    // `xcodebuild` would exit 0 — a vacuous success masking a broken package/test discovery.
    throw new Error(
      'No iOS unit test targets were found in any package. This likely means the package ' +
        'discovery or podspec scanning is broken, since this repository does contain packages ' +
        'with iOS test specs.'
    );
  }

  const schemeFiles = resolveSchemeFiles(targetsToTest);

  // xcodebuild fails if a result bundle already exists at the given path.
  await fs.remove(RESULTS_DIR);

  // A single target runs its CocoaPods-generated scheme directly. Multiple targets are
  // merged into one generated scheme so everything builds and tests in one `xcodebuild`
  // invocation.
  const scheme = targetsToTest.length === 1 ? targetsToTest[0] : generateMergedScheme(schemeFiles);

  const destination = await findSimulatorDestinationAsync();
  const useXcbeautify = await isXcbeautifyAvailableAsync();
  if (!useXcbeautify) {
    console.log(chalk.yellow('xcbeautify not found, falling back to raw xcodebuild output.\n'));
  }

  console.log(`Running tests for targets:\n- ${targetsToTest.join('\n- ')}\n`);

  try {
    await runTestsAsync(scheme, destination, useXcbeautify);
  } catch {
    if (isGithubActions) {
      console.log(`::error title=iOS unit tests::Unit tests failed, see the log for details`);
    }
    throw new Error(`iOS unit tests failed for packages: ${packagesToTest.join(', ')}`);
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
    .option(
      '--affected',
      '[optional] Only test packages affected by changes since `--since` (including their dependents). Ignored when `--packages` is passed.',
      false
    )
    .option(
      '-s, --since <ref>',
      '[optional] Git ref to diff against for `--affected`. Defaults to `main`.',
      'main'
    )
    .description('Runs iOS native unit tests for each package that provides them.')
    .asyncAction(iosNativeUnitTests);
};
