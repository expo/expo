import { XcodeProject, XCScheme, PBXNativeTarget, createBuildableReference } from '@bacons/xcode';
import { Formatter } from '@expo/xcpretty';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import * as Packages from '../Packages';

const NATIVE_TESTS_IOS_DIR = 'apps/native-tests/ios';
const NATIVE_TESTS_PROJECT_ROOT = 'apps/native-tests';

function spawnXcodeBuild(
  args: string[],
  options: SpawnOptionsWithoutStdio,
  { onData }: { onData: (data: string) => void }
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const buildProcess = spawn('xcodebuild', args, options);

  let stdout = '';
  let stderr = '';

  buildProcess.stdout.on('data', (data: Buffer) => {
    const stringData = data.toString();
    stdout += stringData;
    onData(stringData);
  });

  buildProcess.stderr.on('data', (data: Buffer) => {
    const stringData = data instanceof Buffer ? data.toString() : data;
    stderr += stringData;
  });

  return new Promise(async (resolve, reject) => {
    buildProcess.on('close', (code: number) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function spawnXcodeBuildWithFlush(
  args: string[],
  options: SpawnOptionsWithoutStdio,
  { onFlush }: { onFlush: (data: string) => void }
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  let currentBuffer = '';

  // Data can be sent in chunks that would have no relevance to our regex
  // this can cause massive slowdowns, so we need to ensure the data is complete before attempting to parse it.
  function flushBuffer() {
    if (!currentBuffer) {
      return;
    }

    const data = currentBuffer;
    // Reset buffer.
    currentBuffer = '';
    // Process data.
    onFlush(data);
  }

  const data = await spawnXcodeBuild(args, options, {
    onData(stringData) {
      currentBuffer += stringData;
      // Only flush the data if we have a full line.
      if (currentBuffer.endsWith(os.EOL)) {
        flushBuffer();
      }
    },
  });

  // Flush log data at the end just in case we missed something.
  flushBuffer();
  return data;
}

async function spawnXcodeBuildWithFormat(
  args: string[],
  options: SpawnOptionsWithoutStdio,
  { projectRoot }: { projectRoot: string }
): Promise<{ code: number | null; stdout: string; stderr: string; formatter: Formatter }> {
  console.debug(`Command to be executed:\n  xcodebuild ${args.join(' ')}`);

  console.log(`Starting build`);

  const formatter = new TestSuiteFormatter({ projectRoot });

  const results = await spawnXcodeBuildWithFlush(args, options, {
    onFlush(data) {
      // Process data through formatter for display
      for (const line of formatter.pipe(data)) {
        console.log(line);
      }
    },
  });

  console.debug(`xcodebuild exited with code: ${results.code}`);

  if (
    // User cancelled with ctrl-c
    results.code === null ||
    // Build interrupted
    results.code === 75
  ) {
    throw new Error('Xcodebuild process interrupted');
  }

  console.log(formatter.getBuildSummary());

  // Determine if the logger found any errors;
  const hasAnyErrors = !!formatter.errors.length || !!formatter.failed;
  if (results.code !== 0 && hasAnyErrors) {
    const err = new Error(`"xcodebuild" exited with error code ${results.code}.`);
    // @ts-expect-error
    err.stderr = results.stderr;
    throw err;
  }

  return { ...results, formatter };
}

class TestSuiteFormatter extends Formatter {
  public testSuites: number = 0;
  public total: number = 0;
  public failed: number = 0;
  public get passed(): number {
    return this.total - this.failed;
  }

  override formatPassingTest(suite: string, test: string, time: string): string {
    this.total += 1;
    return super.formatPassingTest(suite, test, time);
  }

  override formatFailingTest(
    suite: string,
    test: string,
    reason: string,
    filePath: string
  ): string {
    this.total += 1;
    this.failed += 1;
    return super.formatFailingTest(suite, test, reason, filePath);
  }

  override formatTestRunFinished(name: string, time: string): string {
    this.testSuites += 1;
    return super.formatTestRunFinished(name, time);
  }

  override formatTestSuiteStarted(_name: string): string {
    // All of these are named 'All tests' and only spam
    return '';
  }

  override getBuildSummary(): string {
    const buildResult = super.getBuildSummary();
    const testResult = `\u203A Ran ${this.total} tests in ${this.testSuites} suites, ${this.failed} tests failed\n`;
    return `${buildResult}${testResult}`;
  }
}

/**
 * Generates a temporary xcscheme containing only the requested test targets,
 * then runs xcodebuild test with that scheme.
 */
async function runTests(testTargets: string[]) {
  const workspace = path.join(EXPO_DIR, NATIVE_TESTS_IOS_DIR, 'NativeTests.xcworkspace');

  // Open both projects
  const mainProjectPath = path.join(
    EXPO_DIR,
    NATIVE_TESTS_IOS_DIR,
    'NativeTests.xcodeproj/project.pbxproj'
  );
  const podsProjectPath = path.join(
    EXPO_DIR,
    NATIVE_TESTS_IOS_DIR,
    'Pods/Pods.xcodeproj/project.pbxproj'
  );
  const mainProject = XcodeProject.open(mainProjectPath);
  const podsProject = XcodeProject.open(podsProjectPath);

  // Collect all unit test targets from Pods project
  const podsTestTargets = new Map<string, PBXNativeTarget>();
  for (const [, object] of podsProject) {
    if (
      PBXNativeTarget.is(object) &&
      object.props.productType === 'com.apple.product-type.bundle.unit-test'
    ) {
      podsTestTargets.set(object.props.name, object);
    }
  }

  // Build the scheme using the high-level API
  const generatedSchemeName = 'NativeTests_generated';
  const generatedScheme = XCScheme.create(generatedSchemeName);

  // Add the main app target as the build entry (for testing only)
  const mainAppTarget = mainProject.rootObject.getMainAppTarget('ios')!;
  generatedScheme.addBuildTarget(
    createBuildableReference(mainAppTarget, 'container:NativeTests.xcodeproj'),
    { testing: true }
  );

  // Add each requested test target
  for (const targetName of testTargets) {
    const target = podsTestTargets.get(targetName);
    if (!target) {
      throw new Error(
        `Test target "${targetName}" not found in Pods.xcodeproj. ` +
          `Available test targets: ${[...podsTestTargets.keys()].join(', ')}`
      );
    }
    generatedScheme.addTestTarget(
      createBuildableReference(target, 'container:Pods/Pods.xcodeproj')
    );
  }

  // Save the scheme as a shared scheme in the main project
  mainProject.saveScheme(generatedScheme);
  console.log(`Generated scheme "${generatedSchemeName}" with ${testTargets.length} test targets`);

  try {
    const args = [
      'test',
      '-workspace',
      workspace,
      '-scheme',
      generatedSchemeName,
      '-destination',
      'platform=iOS Simulator,name=iPhone 17 Pro',
      '-configuration',
      'Debug',
      '-derivedDataPath',
      '/tmp/ExpoUnitTestsDerivedData',
      '-skipPackagePluginValidation',
      'CODE_SIGN_IDENTITY=',
      'CODE_SIGNING_REQUIRED=NO',
    ];

    await spawnXcodeBuildWithFormat(
      args,
      {
        cwd: EXPO_DIR,
      },
      {
        projectRoot: path.join(EXPO_DIR, NATIVE_TESTS_PROJECT_ROOT),
      }
    );
  } finally {
    // Clean up the generated scheme
    if (generatedScheme.filePath) {
      fs.removeSync(generatedScheme.filePath);
    }
  }
}

function getTestSpecNames(pkg: Packages.Package): string[] {
  const podspec = fs.readFileSync(path.join(pkg.path, pkg.podspecPath!), 'utf8');
  const regex = new RegExp("test_spec\\s'([^']*)'", 'g');
  const testSpecNames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(podspec)) !== null) {
    testSpecNames.push(match[1]);
  }
  return testSpecNames;
}

export async function iosNativeUnitTests({ packages }: { packages?: string }) {
  const allPackages = await Packages.getListOfPackagesAsync();
  const packageNamesFilter = packages ? packages.split(',') : [];

  const targetsToTest: string[] = [];
  const packagesToTest: string[] = [];
  for (const pkg of allPackages) {
    if (pkg.packageName === 'expo-modules-core') {
      if (packageNamesFilter.length > 0 && !packageNamesFilter.includes(pkg.packageName)) {
        continue;
      }
      // @tsapeta @barthap: `expo-modules-core` contains multiple podspecs (Core, JSI, Worklets).
      // This breaks `expotools` test discovery because it often resolves the wrong `podspecPath`.
      // We manually include the core tests here as a workaround. If new podspecs are added
      // to this package, they must be manually registered here.
      targetsToTest.push(`ExpoModulesCore-Unit-Tests`);
      targetsToTest.push(`ExpoModulesJSI-Unit-Tests`);
      packagesToTest.push(pkg.packageName);
      continue;
    }

    if (!pkg.podspecName || !pkg.podspecPath || !(await pkg.hasNativeTestsAsync('ios'))) {
      if (packageNamesFilter.includes(pkg.packageName)) {
        throw new Error(`The package ${pkg.packageName} does not include iOS unit tests.`);
      }
      continue;
    }

    if (packageNamesFilter.length > 0 && !packageNamesFilter.includes(pkg.packageName)) {
      continue;
    }

    const testSpecNames = getTestSpecNames(pkg);
    if (!testSpecNames.length) {
      throw new Error(
        `Failed to test package ${pkg.packageName}: no test specs were found in podspec file.`
      );
    }

    for (const testSpecName of testSpecNames) {
      targetsToTest.push(`${pkg.podspecName}-Unit-${testSpecName}`);
    }
    packagesToTest.push(pkg.packageName);
  }

  if (packageNamesFilter.length && !targetsToTest.length) {
    throw new Error(
      `No packages were found with the specified names: ${packageNamesFilter.join(', ')}`
    );
  }

  try {
    console.log(`Running tests for targets:\n- ${targetsToTest.join('\n- ')}\n`);
    await runTests(targetsToTest);
  } catch (error) {
    console.error('iOS unit tests failed:');
    console.error('stdout >', error.stdout);
    console.error('stderr >', error.stderr);
    throw new Error('iOS Unit tests failed');
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
