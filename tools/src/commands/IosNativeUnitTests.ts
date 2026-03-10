import spawnAsync from '@expo/spawn-async';
import { XcodeProject, XCScheme, PBXNativeTarget, createBuildableReference } from '@bacons/xcode';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const NATIVE_TESTS_IOS_DIR = 'apps/native-tests/ios';

/**
 * Generates a temporary xcscheme containing only the requested test targets,
 * then runs xcodebuild test with that scheme.
 */
async function runTests(testTargets: string[]) {
  const repoRoot = Directories.getExpoRepositoryRootDir();
  const workspace = path.join(repoRoot, NATIVE_TESTS_IOS_DIR, 'NativeTests.xcworkspace');

  // Open both projects
  const mainProjectPath = path.join(
    repoRoot,
    NATIVE_TESTS_IOS_DIR,
    'NativeTests.xcodeproj/project.pbxproj'
  );
  const podsProjectPath = path.join(
    repoRoot,
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
  console.log(
    `Generated scheme "${generatedSchemeName}" with ${testTargets.length} test targets`
  );

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

    await spawnAsync('xcodebuild', args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });
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
