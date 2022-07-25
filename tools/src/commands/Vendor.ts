import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

import {
  Append,
  Clone,
  CopyFiles,
  Pipe,
  Platform,
  prefixPackage,
  RemoveDirectory,
  renameClass,
  renameIOSFiles,
  renameIOSSymbols,
  TransformFilesContent,
  TransformFilesName,
} from '../vendoring/devmenu';
import { RemoveFiles } from '../vendoring/devmenu/steps/RemoveFiles';

const CONFIGURATIONS = {
  '[dev-menu] reanimated': getReanimatedPipe(),
  '[dev-menu] gesture-handler': getGestureHandlerPipe(),
  '[dev-menu] safe-area-context': getSafeAreaPipe(),
};

function getReanimatedPipe() {
  console.warn(
    'You have to adjust the installation steps of the react-native-reanimated to work well with the react-native-gesture-handler. For more information go to the https://github.com/expo/expo/pull/17878'
  );
  const destination = 'packages/expo-dev-menu/vendored/react-native-reanimated';

  // prettier-ignore
  return new Pipe().addSteps(
    'all',
      new Clone({
        url: 'git@github.com:software-mansion/react-native-reanimated.git',
        tag: '2.9.1',
      }),
      new RemoveDirectory({
        name: 'clean vendored folder',
        target: destination,
      }),
      new TransformFilesContent({
        filePattern: '**/*.@(h|cpp)',
        find: 'namespace reanimated',
        replace: 'namespace devmenureanimated',
      }),
      new TransformFilesContent({
         filePattern: '**/*.@(h|cpp)',
         find: 'reanimated::',
         replace: 'devmenureanimated::',
       }),
      new TransformFilesContent({
        filePattern: 'Common/**/ReanimatedHiddenHeaders.h',
        find: 'Common/cpp',
        replace: 'vendored/react-native-reanimated/Common/cpp',
      }),
      new CopyFiles({
        filePattern: ['src/**/*.*', '*.d.ts', 'plugin.js', 'Common/**/*.@(h|cpp)'],
        to: destination,
      }),

    'android',
      prefixPackage({
        packageName: 'com.swmansion.reanimated',
        prefix: 'devmenu',
      }),
      prefixPackage({
        packageName: 'com.swmansion.common',
        prefix: 'devmenu',
      }),
      renameClass({
        filePattern: 'android/**/*.@(java|kt)',
        className: 'UIManagerReanimatedHelper',
        newClassName: 'DevMenuUIManagerReanimatedHelper'
      }),
       new TransformFilesContent({
        filePattern: 'android/src/main/cpp/**/*.@(h|cpp)',
        find: 'Lcom/swmansion/reanimated',
        replace: 'Ldevmenu/com/swmansion/reanimated',
      }),
      new TransformFilesContent({
        filePattern: 'android/**/*.@(java|kt)',
        find: 'System\\.loadLibrary\\("reanimated"\\)',
        replace: 'System.loadLibrary("devmenureanimated")',
      }),
      new TransformFilesContent({
        filePattern: 'android/CMakeLists.txt',
        find: 'set \\(PACKAGE_NAME "reanimated"\\)',
        replace: 'set (PACKAGE_NAME "devmenureanimated")',
      }),
      new TransformFilesName({
        filePattern: 'android/**/ReanimatedUIManager.java',
        find: 'ReanimatedUIManager',
        replace: 'DevMenuReanimatedUIManager',
      }),
      new TransformFilesContent({
        filePattern: 'android/**/*.@(java|kt)',
        find: 'ReaUiImplementationProvider',
        replace: 'DevMenuReaUiImplementationProvider',
      }),
      new TransformFilesContent({
        filePattern: 'android/**/*.@(java|kt)',
        find: 'ReanimatedUIManager',
        replace: 'DevMenuReanimatedUIManager',
      }),
      new TransformFilesName({
        filePattern: 'android/**/ReanimatedUIImplementation.java',
        find: 'ReanimatedUIImplementation',
        replace: 'DevMenuReanimatedUIImplementation',
      }),
      new TransformFilesContent({
        filePattern: 'android/**/*.@(java|kt)',
        find: 'ReanimatedUIImplementation',
        replace: 'DevMenuReanimatedUIImplementation',
      }),
      new TransformFilesContent({
        filePattern: 'android/**/ReanimatedPackage.java',
        find: 'public class ReanimatedPackage extends TurboReactPackage implements ReactPackage {',
        replace: 'public class ReanimatedPackage extends TurboReactPackage implements ReactPackage {\n  public ReactInstanceManager instanceManager;\n',
      }),
      new TransformFilesContent({
        filePattern: 'android/**/ReanimatedPackage.java',
        find: 'public ReactInstanceManager getReactInstanceManager(ReactApplicationContext reactContext) {',
        replace: 'public ReactInstanceManager getReactInstanceManager(ReactApplicationContext reactContext) {\nreturn instanceManager;\n',
      }),
    'ios',
      new RemoveFiles({
        filePattern: 'ios/native/UIResponder+*'
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(h|mm)',
        find: 'namespace reanimated',
        replace: 'namespace devmenureanimated',
      }),
      new TransformFilesContent({
         filePattern: 'ios/**/*.@(h|mm)',
         find: 'reanimated::',
         replace: 'devmenureanimated::',
       }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(h|m|mm)',
        find: '#import <RNReanimated\\/(.*)>',
        replace: '#import "$1"',
      }),
      new TransformFilesName({
        filePattern: 'ios/**/*REA*.@(h|m|mm)',
        find: 'REA',
        replace: 'DevMenuREA',
      }),
      renameIOSSymbols({
        find: 'REA',
        replace: 'DevMenuREA',
      }),
      new TransformFilesName({
        filePattern: 'ios/**/*Reanimated*.@(h|m|mm)',
        find: 'Reanimated',
        replace: 'DevMenuReanimated',
      }),
      renameIOSSymbols({
        find: 'Reanimated',
        replace: 'DevMenuReanimated',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(h|m|mm)',
        find: 'SimAnimationDragCoefficient',
        replace: 'DevMenuSimAnimationDragCoefficient',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(h|m|mm)',
        find: '^RCT_EXPORT_MODULE\\((.*)\\)',
        replace: '+ (NSString *)moduleName { return @"$1"; }',
      }),
      new TransformFilesName({
        filePattern: 'ios/RNGestureHandlerStateManager.h',
        find: 'RNGestureHandlerStateManager',
        replace: 'DevMenuRNGestureHandlerStateManager',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(h|m|mm)',
        find: 'RNGestureHandlerStateManager',
        replace: 'DevMenuRNGestureHandlerStateManager',
      }),
      new CopyFiles({
        filePattern: 'ios/**/*.@(m|h|mm)',
        to: destination,
      }),
  );
}

function getGestureHandlerPipe() {
  const destination = 'packages/expo-dev-menu/vendored/react-native-gesture-handler';

  // prettier-ignore
  return new Pipe().addSteps(
    'all',
      new Clone({
        url: 'git@github.com:software-mansion/react-native-gesture-handler.git',
        tag: '2.1.2',
      }),
      new RemoveDirectory({
        name: 'clean vendored folder',
        target: destination,
      }),
      new CopyFiles({
        subDirectory: 'src',
        filePattern: ['**/*.ts', '**/*.tsx'],
        to: path.join(destination, 'src'),
      }),
      new CopyFiles({
        filePattern: 'jestSetup.js',
        to: destination,
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
        subDirectory: 'android/common/src/main/java',
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
        filePattern: 'ios/**/*.@(h|m)',
        to: destination,
      })
  );
}

function getSafeAreaPipe() {
  const destination = 'packages/expo-dev-menu/vendored/react-native-safe-area-context';

  // prettier-ignore
  return new Pipe().addSteps(
    'all',
      new Clone({
        url: 'git@github.com:th3rdwave/react-native-safe-area-context.git',
        tag: 'v3.3.2',
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
        packageName: 'com.th3rdwave.safeareacontext',
        prefix: 'devmenu',
      }),
      new CopyFiles({
        subDirectory: 'android/src/main/java/com/th3rdwave',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/devmenu/com/th3rdwave'),
      }),
      new CopyFiles({
        subDirectory: 'android/src/main/java/com/facebook',
        filePattern: '**/*.@(java|kt|xml)',
        to: path.join(destination, 'android/com/facebook'),
      }),

    'ios',
      new TransformFilesName({
        filePattern: 'ios/**/*RNC*.@(m|h)',
        find: 'RNC',
        replace: 'DevMenuRNC',
      }),
      new TransformFilesName({
        filePattern: 'ios/**/*SafeAreaCompat.@(m|h)',
        find: 'SafeAreaCompat',
        replace: 'DevMenuSafeAreaCompat',
      }),
      renameIOSSymbols({
        find: 'RNC',
        replace: 'DevMenuRNC',
      }),
      renameIOSSymbols({
        find: 'SafeAreaCompat',
        replace: 'DevMenuSafeAreaCompat',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/*.@(m|h)',
        find: 'UIEdgeInsetsEqualToEdgeInsetsWithThreshold',
        replace: 'DevMenuUIEdgeInsetsEqualToEdgeInsetsWithThreshold',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/DevMenuRNCSafeAreaProviderManager.@(m|h)',
        find: '^RCT_EXPORT_MODULE\\((.*)\\)',
        replace: '+ (NSString *)moduleName { return @"RNCSafeAreaProvider"; }',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/DevMenuRNCSafeAreaViewManager.@(m|h)',
        find: '^RCT_EXPORT_MODULE\\((.*)\\)',
        replace: '+ (NSString *)moduleName { return @"RNCSafeAreaView"; }',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/DevMenuRNCSafeAreaProviderManager.@(m|h)',
        find: 'constantsToExport',
        replace: 'constantsToExportAsync',
      }),
      new TransformFilesContent({
        filePattern: 'ios/**/DevMenuRNCSafeAreaProviderManager.m',
        find: '@end',
        replace: '',
      }),

      new Append({
        filePattern: 'ios/**/DevMenuRNCSafeAreaProviderManager.m',
        append: `// this method cannot be called from background thread - enforcing dispatch_sync()
        - (NSDictionary *)constantsToExport
 {
   __block NSDictionary *constants;
  
   dispatch_sync(dispatch_get_main_queue(), ^{
     UIWindow* window = [[UIApplication sharedApplication] keyWindow];
     if (@available(iOS 11.0, *)) {
       UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
       constants = @{
         @"initialWindowMetrics": @{
           @"insets": @{
             @"top": @(safeAreaInsets.top),
             @"right": @(safeAreaInsets.right),
             @"bottom": @(safeAreaInsets.bottom),
             @"left": @(safeAreaInsets.left),
           },
           @"frame": @{
             @"x": @(window.frame.origin.x),
             @"y": @(window.frame.origin.y),
             @"width": @(window.frame.size.width),
             @"height": @(window.frame.size.height),
           },
         }
       };
     } else {
       constants = @{ @"initialWindowMetrics": @{
           @"insets": @{
             @"top": @(20),
             @"right": @(0),
             @"bottom": @(0),
             @"left": @(0),
           },
           @"frame": @{
             @"x": @(window.frame.origin.x),
             @"y": @(window.frame.origin.y),
             @"width": @(window.frame.size.width),
             @"height": @(window.frame.size.height),
           },
         }
       } ;
     }
   });
  
  return constants;
}

@end
`
      }),
      
      new CopyFiles({
        filePattern: 'ios/**/*.@(m|h)',
        to: destination,
      }),
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
