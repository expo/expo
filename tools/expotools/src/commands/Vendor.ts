import { Command } from '@expo/commander';
import os from 'os';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import {
  Clone,
  CopyFiles,
  Pipe,
  TransformFilesContent,
  TransformFilesName,
  RemoveDirectory,
  prefixPackage,
  renameIOSSymbols,
  renameIOSFiles,
  Platform,
} from '../vendoring';

const CONFIGURATIONS = {
  '[dev-menu] reanimated': getReanimatedPipe(),
  '[dev-menu] gesture-handler': getGestureHandlerPipe(),
};

function getReanimatedPipe() {
  const destination = 'packages/expo-dev-menu/vendored/react-native-reanimated';

  // prettier-ignore
  return new Pipe().addSteps(
    'all',
      new Clone({
        name: 'clone react-native-reanimated v1',
        url: 'git@github.com:software-mansion/react-native-reanimated.git',
        tag: '1.13.0',
      }),
      new RemoveDirectory({
        name: 'clean react-native-reanimated folder',
        target: destination,
      }),
      new CopyFiles({
        name: 'copy js files',
        filePatterns: [path.join('src', '**', '*.*'), '*.d.ts'],
        to: destination,
      }),

    'android',
      prefixPackage({
        packageName: 'com.swmansion.reanimated',
        prefix: 'devmenu',
      }),
      new TransformFilesName({
        name: "rename 'UIManagerReanimatedHelper.java'",
        filePattern: path.join('android', '**', 'UIManagerReanimatedHelper.java'),
        find: 'UIManagerReanimatedHelper',
        replace: 'DevMenuUIManagerReanimatedHelper',
      }),
      new TransformFilesContent({
        name: 'replace UIManagerReanimatedHelper class name',
        filePattern: path.join('android', '**', '*.@(java|kt)'),
        find: 'UIManagerReanimatedHelper',
        replace: 'DevMenuUIManagerReanimatedHelper',
      }),
      new CopyFiles({
        name: 'copy reanimated package',
        subDirectory: path.join('android', 'src', 'main', 'java', 'com', 'swmansion'),
        filePatterns: [path.join('**', '*.@(java|kt|xml)')],
        to: path.join(destination, 'android', 'devmenu', 'com', 'swmansion'),
      }),
      new CopyFiles({
        name: 'copy facebook package',
        subDirectory: path.join('android', 'src', 'main', 'java', 'com', 'facebook'),
        filePatterns: [path.join('**', '*.@(java|kt|xml)')],
        to: path.join(destination, 'android', 'com', 'facebook'),
      }),

    'ios',
      new TransformFilesName({
        name: 'rename ios source files',
        filePattern: path.join('ios', '**', '*REA*.@(m|h)'),
        find: 'REA',
        replace: 'DevMenuREA',
      }),
      renameIOSSymbols({
        find: 'REA',
        replace: 'DevMenuREA',
      }),
      new TransformFilesContent({
        name: 'rename SimAnimationDragCoefficient function',
        filePattern: path.join('ios', '**', '*.@(m|h)'),
        find: 'SimAnimationDragCoefficient',
        replace: 'DevMenuSimAnimationDragCoefficient',
      }),
      new TransformFilesContent({
        name: 'remove RCT_EXPORT_MODULE macro',
        filePattern: path.join('ios', '**', '*.@(m|h)'),
        find: '^RCT_EXPORT_MODULE\\((.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
      }),
      new CopyFiles({
        name: 'copy source files',
        filePatterns: [path.join('ios', '**', '*.@(m|h)')],
        to: destination,
      })
  );
}

function getGestureHandlerPipe() {
  const destination = 'packages/expo-dev-menu/vendored/react-native-gesture-handler';

  // prettier-ignore
  return new Pipe().addSteps(
    'all',
      new Clone({
        name: 'clone react-gesture-handler v1',
        url: 'git@github.com:software-mansion/react-native-gesture-handler.git',
        tag: '1.7.0',
      }),
      new RemoveDirectory({
        name: 'clean react-gesture-handler folder',
        target: destination,
      }),
      new CopyFiles({
        name: 'copy main js files',
        filePatterns: ['*.js', path.join('touchables', '*.js'), '*.d.ts'],
        to: path.join(destination, 'src'),
      }),

    'android',
      prefixPackage({
        packageName: 'com.swmansion.gesturehandler',
        prefix: 'devmenu',
      }),
      new TransformFilesName({
        name: "rename 'RNGHModalUtils.java'",
        filePattern: path.join('android', '**', 'RNGHModalUtils.java'),
        find: 'RNGHModalUtils',
        replace: 'DevMenuRNGHModalUtils',
      }),
      new TransformFilesContent({
        name: 'replace RNGHModalUtils class name',
        filePattern: path.join('android', '**', '*.@(java|kt)'),
        find: 'RNGHModalUtils',
        replace: 'DevMenuRNGHModalUtils',
      }),
      new CopyFiles({
        name: 'copy gesture main package',
        subDirectory: path.join('android', 'src', 'main', 'java', 'com', 'swmansion'),
        filePatterns: [path.join('**', '*.@(java|kt|xml)')],
        to: path.join(destination, 'android', 'devmenu', 'com', 'swmansion'),
      }),
      new CopyFiles({
        name: 'copy gesture lib package',
        subDirectory: path.join('android', 'lib', 'src', 'main', 'java'),
        filePatterns: [path.join('**', '*.@(java|kt|xml)')],
        to: path.join(destination, 'android', 'devmenu'),
      }),
      new CopyFiles({
        name: 'copy facebook package',
        subDirectory: path.join('android', 'src', 'main', 'java', 'com', 'facebook'),
        filePatterns: [path.join('**', '*.@(java|kt|xml)')],
        to: path.join(destination, 'android', 'com', 'facebook'),
      }),

    'ios',
      renameIOSFiles({
        find: 'RN',
        replace: 'DevMenuRN',
      }),
      renameIOSSymbols({
        find: 'RN',
        replace: 'DevMenuRN',
      }),
      new TransformFilesContent({
        name: 'remove RCT_EXPORT_MODULE macro',
        filePattern: path.join('ios', '**', '*.@(m|h)'),
        find: '^RCT_EXPORT_MODULE\\(DevMenu(.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
      }),
      new TransformFilesContent({
        name: 'remove RCT_EXPORT_MODULE macro',
        filePattern: path.join('ios', '**', '*.@(m|h)'),
        find: '^RCT_EXPORT_MODULE\\(\\)',
        replace: '+ (NSString *)moduleName { return @"RNGestureHandlerModule"; }',
      }),
      new CopyFiles({
        name: 'copy ios source files',
        filePatterns: [path.join('ios', '**', '*.@(m|h)')],
        to: destination,
      })
  );
}

async function askForConfigurations(): Promise<string[]> {
  const { configurationNames } = await inquirer.prompt<{ configurationNames: string[] }>([
    {
      type: 'checkbox',
      name: 'configurationNames',
      message: 'Which configuration would you like to run?',
      choices: Object.keys(CONFIGURATIONS),
      default: Object.keys(CONFIGURATIONS),
    },
  ]);
  return configurationNames;
}

type ActionOptions = {
  platform: Platform;
  configuration: string[];
};

async function action({ configuration, platform }: ActionOptions) {
  if (!configuration.length) {
    configuration = await askForConfigurations();
  }

  const pipes = configuration.map((name) => ({ name, pipe: CONFIGURATIONS[name] as Pipe }));
  const tmpdir = os.tmpdir();
  for (const { name, pipe } of pipes) {
    pipe.setWorkingDirectory(path.join(tmpdir, name));
    await pipe.start(platform);
  }
}

export default (program: Command) => {
  program
    .command('vendor')
    .alias('v')
    .description('Vendors 3rd party modules.')
    .option(
      '-p, --platform <string>',
      "A platform on which the vendored module will be updated. Valid options: 'all' | 'ios' | 'android'.",
      'all'
    )
    .option(
      '-c, --configuration [string]',
      'Vendor configuration which should be run. Can be passed multiple times.',
      (value, previous) => previous.concat(value),
      []
    )

    .asyncAction(action);
};
