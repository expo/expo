import path from 'node:path';

/**
 * Help messages
 */
export const HELP_MESSAGE = {
  BUILD_ANDROID: `Usage: expo-brownfield build-android [<options>]\n
Options:
  --help, -h                    display help for 'build-android'
  --debug, -d                   build in debug configuration
  --release, -r                 build in release configuration
  --verbose                     forward all output to the terminal
  --all, -a                     build both debug and release configurations
  --repository, --repo          maven repository for publishing artifacts (multiple can be passed)
  --task, -t                    publishing task to be run (multiple can be passed)
  --library, -l                 name of the brownfield library`,
  BUILD_IOS: `Usage: expo-brownfield build-ios [<options>]\n
Options:
  --help, -h                    display help for 'build-ios'
  --debug, -d                   build in debug configuration
  --release, -r                 build in release configuration
  --verbose                     forward all output to the terminal
  --artifacts, -a               path to artifacts directory
  --scheme, -s                  scheme to be built
  --xcworkspace, -x             path to Xcode workspace (.xcworkspace)`,
  GENERAL: `Usage: expo-brownfield <command> [<options>]\n
Options:
  --version, -v                 output the version number
  --help, -h                    display help for command\n
Commands:
  build-android [<options>]     build and publish Android brownfield artifacts
  build-ios [<options>]         build iOS brownfield artifacts
  tasks-android [<options>]     list available publishing tasks and repositories for android`,
  GENERAL_HEADER: `Usage: expo-brownfield <command> [<options>]`,
  TASKS_ANDROID: `Usage: expo-brownfield tasks-android [<options>]\n
Options:
  --help, -h                    display help for 'tasks-android'
  --verbose                     output all subcommands output to the terminal
  --library, -l                 name of the brownfield library`,
} as const;

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
  VERBOSE: `- Verbose: true`,
} as const;

/**
 * Android build outputs
 */
export const BUILD_ANDROID = {
  CONFIGURATION: `Build configuration:
- Verbose: false
- Build type: All
- Brownfield library: brownfield
- Repositories: []
- Tasks: someGradleTask`,
  LIBRARY: `- Brownfield library: brownfieldlib`,
  REPOSTORIES: `- Repositories: MavenLocal, CustomLocal`,
  TASK: `- Tasks: task1`,
  TASKS: `- Tasks: task1, task2, task3`,
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
} as const;

/**
 * Android tasks outputs
 */
export const TASKS_ANDROID = {
  RESULT: [
    `Publish tasks:`,
    '- publishBrownfieldAllPublicationToMavenLocal',
    '- publishBrownfieldDebugPublicationToMavenLocal',
    '- publishBrownfieldReleasePublicationToMavenLocal',
    'Repositories:',
    '- MavenLocal',
  ],
  VERBOSE: [`> Configure project`, `Publishing tasks\n----------------`, `BUILD SUCCESSFUL in`],
} as const;

/**
 * Error outputs
 */
export const ERROR = {
  ADDITIONAL_COMMAND: (
    command: string
  ) => `Error: Command ${command} doesn't support additional commands
For all available options please use the help command:
npx expo-brownfield ${command} --help`,
  UNKNOWN_COMMAND: () => `Error: unknown command
Supported commands: build-android, build-ios, tasks-android`,
  UNKNOWN_OPTION: (option: string) => `Error: unknown or unexpected option: ${option}`,
} as const;

/**
 * CLI version (= package version)
 */
export const VERSION = require(path.resolve(__dirname, '../../package.json')).version;
