import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import * as Directories from '../Directories';
import * as Packages from '../Packages';

const NATIVE_TESTS_IOS_DIR = 'apps/native-tests/ios';

/**
 * Parses Pods.xcodeproj/project.pbxproj to find all PBXNativeTarget entries
 * that are unit test bundles (productType = com.apple.product-type.bundle.unit-test).
 * Returns a map of target name -> UUID (BlueprintIdentifier).
 */
function getPodsTestTargets(repoRoot: string): Map<string, string> {
  const pbxprojPath = path.join(
    repoRoot,
    NATIVE_TESTS_IOS_DIR,
    'Pods/Pods.xcodeproj/project.pbxproj'
  );
  const content = fs.readFileSync(pbxprojPath, 'utf8');

  const targets = new Map<string, string>();
  const regex =
    /(\w+)\s*\/\*\s*([\w-]+)\s*\*\/\s*=\s*\{[^}]*isa\s*=\s*PBXNativeTarget[^}]*productType\s*=\s*"com\.apple\.product-type\.bundle\.unit-test"[^}]*\}/gs;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    targets.set(match[2], match[1]);
  }
  return targets;
}

/**
 * Generates a xcscheme XML that includes the given test targets.
 * The scheme references the NativeTests.xcodeproj for the main build target
 * and Pods/Pods.xcodeproj for test targets (by BlueprintIdentifier/UUID).
 */
function generateSchemeXml(testTargets: Map<string, string>): string {
  const testableEntries = [...testTargets.entries()]
    .map(
      ([name, uuid]) => `
         <TestableReference
            skipped = "NO">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${uuid}"
               BuildableName = "${name}.xctest"
               BlueprintName = "${name}"
               ReferencedContainer = "container:Pods/Pods.xcodeproj">
            </BuildableReference>
         </TestableReference>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1130"
   version = "1.3">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "NO"
            buildForProfiling = "NO"
            buildForArchiving = "NO"
            buildForAnalyzing = "NO">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "13B07F861A680F5B00A75B9A"
               BuildableName = "NativeTests.app"
               BlueprintName = "NativeTests"
               ReferencedContainer = "container:NativeTests.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
      <Testables>${testableEntries}
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <MacroExpansion>
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "13B07F861A680F5B00A75B9A"
            BuildableName = "NativeTests.app"
            BlueprintName = "NativeTests"
            ReferencedContainer = "container:NativeTests.xcodeproj">
         </BuildableReference>
      </MacroExpansion>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
`;
}

/**
 * Generates a temporary xcscheme containing only the requested test targets,
 * then runs xcodebuild test with that scheme.
 */
async function runTests(testTargets: string[]) {
  const repoRoot = Directories.getExpoRepositoryRootDir();
  const workspace = path.join(repoRoot, NATIVE_TESTS_IOS_DIR, 'NativeTests.xcworkspace');

  // Find all unit test targets in the Pods project with their BlueprintIdentifiers
  const allPodsTestTargets = getPodsTestTargets(repoRoot);

  // Filter to only the requested targets
  const selectedTargets = new Map<string, string>();
  for (const targetName of testTargets) {
    const uuid = allPodsTestTargets.get(targetName);
    if (!uuid) {
      throw new Error(
        `Test target "${targetName}" not found in Pods.xcodeproj. ` +
          `Available test targets: ${[...allPodsTestTargets.keys()].join(', ')}`
      );
    }
    selectedTargets.set(targetName, uuid);
  }

  // Generate and save the scheme
  const generatedSchemeName = 'NativeTests_generated';
  const schemeDir = path.join(
    repoRoot,
    NATIVE_TESTS_IOS_DIR,
    'NativeTests.xcodeproj/xcshareddata/xcschemes'
  );
  const schemePath = path.join(schemeDir, `${generatedSchemeName}.xcscheme`);

  fs.mkdirpSync(schemeDir);
  fs.writeFileSync(schemePath, generateSchemeXml(selectedTargets));
  console.log(`Generated scheme "${generatedSchemeName}" with ${selectedTargets.size} test targets`);

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
    fs.removeSync(schemePath);
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
