import path from 'node:path';

/**
 * Help messages
 */
export const HELP_MESSAGE = {
  GENERAL_HEADER: `Usage: expo-brownfield <command> [<options>]`,
};

/**
 * Common build outputs
 */
export const BUILD = {
  BUILD_TYPE_ALL: `- Build type: All`,
  BUILD_TYPE_DEBUG: `- Build type: Debug`,
  BUILD_TYPE_RELEASE: `- Build type: Release`,
  PREBUILD_PROMPT: `Do you want to run the prebuild now?`,
  PREBUILD_WARNING: (platform: 'android' | 'ios') =>
    `Prebuild for platform: ${platform} is missing`,
  VERBOSE: ` - Verbose: true`,
};

/**
 * Android build outputs
 */
export const BUILD_ANDROID = {
  BUILLD_VARIANT_ALL: `- Build variant: All`,
  BUILLD_VARIANT_DEBUG: `- Build variant: Debug`,
  BUILLD_VARIANT_RELEASE: `- Build variant: Release`,
  LIBRARY: `- Library: brownfieldlib`,
  TASK: [`- Tasks:`, `- task1`],
  TASKS: [`- Tasks:`, `- task1`, `- task2`, `- task3`],
};

/**
 * iOS build outputs
 */
export const BUILD_IOS = {
  ARTIFACT_CLEANUP: `Cleaning up previous artifacts`,
  BUILD_COMMAND: (projectRoot: string, workspace: string, configuration: 'Debug' | 'Release') => [
    `xcodebuild`,
    `-workspace ${projectRoot}/ios/testapp${workspace}.xcworkspace`,
    `-scheme testapp${workspace}brownfield`,
    `-derivedDataPath ${projectRoot}/ios/build`,
    `-destination generic/platform=iphoneos`,
    `-destination generic/platform=iphonesimulator`,
    `-configuration ${configuration}`,
  ],
  CONFIGURATION: (projectRoot: string, workspace: string) => `Build configuration:
- Verbose: false
- Artifacts directory: ${projectRoot}/artifacts
- Build type: Release
- Xcode Scheme: testapp${workspace}brownfield
- Xcode Workspace: ${projectRoot}/ios/testapp${workspace}.xcworkspace`,
  HERMES_COPYING: `Copying hermes XCFramework from Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework to`,
  PACKAGE_COMMAND: (projectRoot: string, workspace: string, configuration: 'Debug' | 'Release') => [
    `xcodebuild`,
    `-create-xcframework`,
    `-framework ${projectRoot}/ios/build/Build/Products/${configuration.toLowerCase()}-iphoneos/testapp${workspace}brownfield.framework`,
    `-framework ${projectRoot}/ios/build/Build/Products/${configuration.toLowerCase()}-iphonesimulator/testapp${workspace}brownfield.framework`,
    `-output ${projectRoot}/artifacts/testapp${workspace}brownfield.xcframework`,
  ],
};

/**
 * Android tasks outputs
 */
export const TASKS_ANDROID = {
  RESULT: [
    `Publishing tasks`,
    '- publishBrownfieldAllPublicationToMavenLocal',
    '- publishBrownfieldDebugPublicationToMavenLocal',
    '- publishBrownfieldReleasePublicationToMavenLocal',
    'Repositories',
    '- MavenLocal',
  ],
  VERBOSE: [`> Configure project`, `Publishing tasks\n----------------`, `BUILD SUCCESSFUL in`],
};

/**
 * Error outputs
 */
export const ERROR = {
  ADDITIONAL_COMMAND: (command: string) =>
    `error: too many arguments for '${command}'. Expected 0 arguments but got 1.`,
  MISSING_PREBUILD: () => `Brownfield cannot be built without prebuilding the native project`,
  MISSING_TASKS_OR_REPOSITORIES: () => `Error: At least one task or repository must be specified`,
  UNKNOWN_COMMAND: () => `Error: unknown command
Supported commands: build:android, build:ios, tasks:android`,
  UNKNOWN_OPTION: (option: string) => `error: unknown option '${option}'`,
};

/**
 * CLI version (= package version)
 */
export const VERSION = require(path.resolve(__dirname, '../../package.json')).version;
