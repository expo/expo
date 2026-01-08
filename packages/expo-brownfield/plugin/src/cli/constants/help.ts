import { helpMessage } from '../utils';

/**
 * Helper function to create a help option for a command.
 * @param command - The command to display help for.
 * @returns The help option.
 */
const helpOption = (command: string = 'command') => ({
  description: `display help for ${command}`,
  option: '--help',
  short: '-h',
});

/**
 * Common build options for Android and iOS.
 */
const commonBuildOptions = [
  {
    description: 'build in debug configuration',
    option: '--debug',
    short: '-d',
  },
  {
    description: 'build in release configuration',
    option: '--release',
    short: '-r',
  },
  {
    description: 'forward all output to the terminal',
    option: '--verbose',
  },
];

/**
 * General help message
 */
const generalHelp = helpMessage({
  commands: [
    {
      command: 'build-android',
      description: 'build and publish Android brownfield artifacts',
      hasOptions: true,
    },
    {
      command: 'build-ios',
      description: 'build iOS brownfield artifacts',
      hasOptions: true,
    },
    {
      command: 'tasks-android',
      description:
        'list available publishing tasks and repositories for android',
      hasOptions: true,
    },
  ],
  options: [
    {
      description: 'output the version number',
      option: '--version',
      short: '-v',
    },
    helpOption(),
  ],
});

/**
 * Help message for 'build-android' command
 */
const buildAndroidHelp = helpMessage({
  promptCommand: 'build-android',
  options: [
    helpOption("'build-android'"),
    ...commonBuildOptions,
    {
      description: 'build both debug and release configurations',
      option: '--all',
      short: '-a',
    },
    {
      description:
        'maven repository for publishing artifacts (multiple can be passed)',
      option: '--repository',
      short: '--repo',
    },
    {
      description: 'publishing task to be run (multiple can be passed)',
      option: '--task',
      short: '-t',
    },
    {
      description: 'name of the brownfield library',
      option: '--library',
      short: '-l',
    },
  ],
});

const tasksAndroidHelp = helpMessage({
  promptCommand: 'tasks-android',
  options: [
    helpOption("'tasks-android'"),
    {
      description: 'output all subcommands output to the terminal',
      option: '--verbose',
    },
    {
      description: 'name of the brownfield library',
      option: '--library',
      short: '-l',
    },
  ],
});

/**
 * Help message for 'build-ios' command
 */
const buildIosHelp = helpMessage({
  promptCommand: 'build-ios',
  options: [
    helpOption("'build-ios'"),
    ...commonBuildOptions,
    {
      description: 'path to artifacts directory',
      option: '--artifacts',
      short: '-a',
    },
    {
      description: 'scheme to be built',
      option: '--scheme',
      short: '-s',
    },
    {
      description: 'path to Xcode workspace (.xcworkspace)',
      option: '--xcworkspace',
      short: '-x',
    },
  ],
});

/**
 * Help messages
 */
export const Help = {
  Android: buildAndroidHelp,
  General: generalHelp,
  IOS: buildIosHelp,
  TasksAndroid: tasksAndroidHelp,
} as const;
