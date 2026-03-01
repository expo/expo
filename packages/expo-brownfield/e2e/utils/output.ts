import path from 'node:path';

/**
 * Help messages
 */
export const HELP_MESSAGE = {
  GENERAL_HEADER: `Usage: expo-brownfield [options] [command]`,
};

/**
 * Common build outputs
 */
export const BUILD = {
  PREBUILD_PROMPT: `Do you want to run the prebuild now?`,
  PREBUILD_WARNING: (platform: 'android' | 'ios') =>
    `Prebuild for platform: ${platform} is missing`,
  VERBOSE: ` - Verbose: true`,
};

/**
 * Android build outputs
 */
export const BUILD_ANDROID = {
  BUILD_VARIANT_ALL: `- Build variant: All`,
  BUILD_VARIANT_DEBUG: `- Build variant: Debug`,
  BUILD_VARIANT_RELEASE: `- Build variant: Release`,
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
  BUILD_TYPE_DEBUG: `- Build configuration: Debug`,
  BUILD_TYPE_RELEASE: `- Build configuration: Release`,
  CONFIGURATION: (projectRoot: string, workspace: string) => [
    `Resolved build configuration`,
    `- Build configuration: Release`,
    `- Scheme: testapp${workspace}brownfield`,
    `- Workspace: ${projectRoot}/ios/testapp${workspace}.xcworkspace`,
    `- Dry run: true`,
    `- Verbose: false`,
    `- Artifacts path: ${projectRoot}/artifacts`,
  ],
  HERMES_COPYING: `Copying hermes XCFramework from Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework to`,
  PACKAGE_COMMAND: (projectRoot: string, workspace: string, configuration: 'Debug' | 'Release') => [
    `xcodebuild`,
    `-create-xcframework`,
    `-framework ${projectRoot}/ios/build/Build/Products/${configuration.toLowerCase()}-iphoneos/testapp${workspace}brownfield.framework`,
    `-framework ${projectRoot}/ios/build/Build/Products/${configuration.toLowerCase()}-iphonesimulator/testapp${workspace}brownfield.framework`,
    `-output ${projectRoot}/artifacts/testapp${workspace}brownfield.xcframework`,
  ],
  PACKAGE_CONFIGURATION: (packageName: string) => `- Package name: ${packageName}`,
  PACKAGE_CREATION: (packageName: string) =>
    `Creating Swift package with name: ${packageName} at path:`,
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
  MISSING_ARGUMENT: (short: string, full: string, argumentName: string) =>
    `error: option '-${short}, --${full} <${argumentName}>' argument missing`,
  MISSING_PREBUILD: () => `Brownfield cannot be built without prebuilding the native project`,
  MISSING_TASKS_OR_REPOSITORIES: () => `Error: At least one task or repository must be specified`,
  UNKNOWN_COMMAND: (command: string) => `error: unknown command '${command}'`,
  UNKNOWN_OPTION: (option: string) => `error: unknown option '${option}'`,
};

/**
 * CLI version (= package version)
 */
export const VERSION = require(path.resolve(__dirname, '../../package.json')).version;
