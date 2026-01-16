import path from 'node:path';

/**
 * Expected output for the CLI comands and options
 */
export const ExpectedOutput = {
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
    Full: `Usage: expo-brownfield <command>  [<options>]\n
Options:
  --version, -v                 output the version number
  --help, -h                    display help for command\n
Commands:
  build-android [<options>]     build and publish Android brownfield artifacts
  build-ios [<options>]         build iOS brownfield artifacts
  tasks-android [<options>]     list available publishing tasks and repositories for android`,
    Header: `Usage: expo-brownfield <command>  [<options>]`,
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
    Full: `Usage: expo-brownfield tasks-android  [<options>]\n
Options:
  --help, -h                    display help for 'tasks-android'
  --verbose                     output all subcommands output to the terminal
  --library, -l                 name of the brownfield library`,
  },
  Version: require(path.resolve(__dirname, '../../../package.json')).version,
} as const;
