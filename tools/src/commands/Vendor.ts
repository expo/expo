import { Command } from '@expo/commander';
import os from 'os';
import chalk from 'chalk';
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
  renameClass,
  Append,
} from '../vendoring/devmenu';

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
        url: 'git@github.com:software-mansion/react-native-reanimated.git',
        tag: '1.13.0',
      }),
      new RemoveDirectory({
        name: 'clean vendored folder',
        target: destination,
      }),
      new CopyFiles({
        filePattern: ['src/**/*.*', '*.d.ts'],
        to: destination,
      }),

    'android',
      prefixPackage({
        packageName: 'com.swmansion.reanimated',
        prefix: 'devmenu',
      }),
      renameClass({
        filePattern: 'android/**/*.@(java|kt)',
        className: 'UIManagerReanimatedHelper',
        newClassName: 'DevMenuUIManagerReanimatedHelper'
      }),
      new CopyFiles({
        subDirectory: 'android/src/main/java/com/swmansion',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/devmenu/com/swmansion'),
      }),
      new CopyFiles({
        subDirectory: 'android/src/main/java/com/facebook',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/com/facebook'),
      }),

    'ios',
      new TransformFilesName({
        filePattern: 'ios/**/*REA*.@(m|h)',
        find: 'REA',
        replace: 'DevMenuREA',
      }),
      renameIOSSymbols({
        find: 'REA',
        replace: 'DevMenuREA',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: 'SimAnimationDragCoefficient',
        replace: 'DevMenuSimAnimationDragCoefficient',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: '^RCT_EXPORT_MODULE\\((.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
      }),
      new CopyFiles({
        filePattern: 'ios/**/*.@(m|h)',
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
        url: 'git@github.com:software-mansion/react-native-gesture-handler.git',
        tag: '1.7.0',
      }),
      new RemoveDirectory({
        name: 'clean vendored folder',
        target: destination,
      }),
      new CopyFiles({
        filePattern: ['*.js', 'touchables/*.js', '*.d.ts'],
        to: path.join(destination, 'src'),
      }),

    'android',
      prefixPackage({
        packageName: 'com.swmansion.gesturehandler',
        prefix: 'devmenu',
      }),
      renameClass({
        filePattern: 'android/**/*.@(java|kt)',
        className: 'RNGHModalUtils',
        newClassName: 'DevMenuRNGHModalUtils'
      }),
      new CopyFiles({
        subDirectory: 'android/src/main/java/com/swmansion',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/devmenu/com/swmansion'),
      }),
      new CopyFiles({
        subDirectory: 'android/lib/src/main/java',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/devmenu'),
      }),
      new CopyFiles({
        subDirectory: 'android/src/main/java/com/facebook',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/com/facebook'),
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
        filePattern: path.join('ios', '**', '*.@(m|h)'),
        find: '^RCT_EXPORT_MODULE\\(DevMenu(.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: '^RCT_EXPORT_MODULE\\(\\)',
        replace: '+ (NSString *)moduleName { return @"RNGestureHandlerModule"; }',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/DevMenuRNGestureHandlerModule.m',
        find: '@interface DevMenuRNGestureHandlerButtonManager([\\s\\S]*?)@end',
        replace: ''
      }),
      new Append({
        filePattern: 'ios/**/DevMenuRNGestureHandlerModule.h',
        append: `@interface DevMenuRNGestureHandlerButtonManager : RCTViewManager
@end
`
      }),
      new CopyFiles({
        filePattern: 'ios/**/*.@(m|h)',
        to: destination,
      })
  );
}

async function askForConfigurations(): Promise<string[]> {
  const { configurationNames } = await inquirer.prompt<{ configurationNames: string[] }>([
    {
      type: 'checkbox',
      name: 'configurationNames',
      message: 'Which configuration would you like to run?\n  ● selected ○ unselected\n',
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
    console.log(`Run configuration: ${chalk.green(name)}`);
    pipe.setWorkingDirectory(path.join(tmpdir, name));
    await pipe.start(platform);
    console.log();
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
