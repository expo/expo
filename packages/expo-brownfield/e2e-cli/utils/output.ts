import path from 'node:path';

/**
 * Expected output for the CLI comands and options
 */
export const ExpectedOutput = {
  Android: {
    InferenceError: `Error: Value of Android library name could not be inferred from the project`,
  },
  BuildAndroid: {
    AllConfig: `- Build type: All`,
    Configuration: `Build configuration:
- Verbose: false
- Build type: All
- Brownfield library: brownfield
- Repositories: []
- Tasks: someGradleTask`,
    DebugConfig: `- Build type: Debug`,
    LibraryConfig: `- Brownfield library: brownfieldlib`,
    ReleaseConfig: `- Build type: Release`,
    RepositoriesConfig: `- Repositories: MavenLocal, CustomLocal`,
    TaskConfig: `- Tasks: task1`,
    TasksConfig: `- Tasks: task1, task2, task3`,
    VerboseConfig: `- Verbose: true`,
  },
  BuildAndroidHelp: {
    Full: `Usage: expo-brownfield build-android [<options>]\n
Options:
  --help, -h                    display help for 'build-android'
  --debug, -d                   build in debug configuration
  --release, -r                 build in release configuration
  --verbose                     forward all output to the terminal
  --all, -a                     build both debug and release configurations
  --repository, --repo          maven repository for publishing artifacts (multiple can be passed)
  --task, -t                    publishing task to be run (multiple can be passed)
  --library, -l                 name of the brownfield library`,
  },
  Error: {
    AdditionalCommand: (
      command: string
    ) => `Error: Command ${command} doesn't support additional commands
For all available options please use the help command:
npx expo-brownfield ${command} --help`,
    UnknownCommand: () => `Error: unknown command
Supported commands: build-android, build-ios, tasks-android`,
    UnknownOption: (option: string) => `Error: unknown or unexpected option: ${option}`,
  },
  GeneralHelp: {
    Full: `Usage: expo-brownfield <command> [<options>]\n
Options:
  --version, -v                 output the version number
  --help, -h                    display help for command\n
Commands:
  build-android [<options>]     build and publish Android brownfield artifacts
  build-ios [<options>]         build iOS brownfield artifacts
  tasks-android [<options>]     list available publishing tasks and repositories for android`,
    Header: `Usage: expo-brownfield <command> [<options>]`,
  },
  Prebuild: {
    Prompt: `Do you want to run the prebuild now?`,
    Warning: (platform: 'android' | 'ios') => `Prebuild for platform: ${platform} is missing`,
  },
  TasksAndroid: {
    Result: [
      `Publish tasks:`,
      '- publishBrownfieldAllPublicationToMavenLocal',
      '- publishBrownfieldDebugPublicationToMavenLocal',
      '- publishBrownfieldReleasePublicationToMavenLocal',
      'Repositories:',
      '- MavenLocal',
    ],
    Verbose: [`> Configure project`, `Publishing tasks\n----------------`, `BUILD SUCCESSFUL in`],
  },
  TasksAndroidHelp: {
    Full: `Usage: expo-brownfield tasks-android [<options>]\n
Options:
  --help, -h                    display help for 'tasks-android'
  --verbose                     output all subcommands output to the terminal
  --library, -l                 name of the brownfield library`,
  },
  Version: require(path.resolve(__dirname, '../../package.json')).version,
} as const;
