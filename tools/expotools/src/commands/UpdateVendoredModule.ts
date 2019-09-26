import os from 'os';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import xcode from 'xcode';
import glob from 'glob-promise';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import { Command } from '@expo/commander';

import * as Directories from '../Directories';

interface ActionOptions {
  list: boolean;
  module: string;
  platform: 'ios' | 'android' | 'all';
  commit: string;
  pbxproj: boolean;
}

interface VendoredModuleUpdateStep {
  iosPrefix?: string;
  sourceIosPath?: string;
  targetIosPath?: string;
  sourceAndroidPath?: string;
  targetAndroidPath?: string;
  sourceAndroidPackage?: string;
  targetAndroidPackage?: string;
  recursive?: boolean;
  updatePbxproj?: boolean;
}

interface VendoredModuleConfig {
  repoUrl: string;
  packageName?: string;
  installableInManagedApps?: boolean;
  skipCleanup?: boolean;
  steps: VendoredModuleUpdateStep[];
  warnings?: string[];
}

const IOS_DIR = Directories.getIosDir();
const ANDROID_DIR = Directories.getAndroidDir();
const PACKAGES_DIR = Directories.getPackagesDir();
const BUNDLED_NATIVE_MODULES_PATH = path.join(PACKAGES_DIR, 'expo', 'bundledNativeModules.json');

const vendoredModulesConfig: { [key: string]: VendoredModuleConfig } = {
  'react-native-gesture-handler': {
    repoUrl: 'https://github.com/kmagiera/react-native-gesture-handler.git',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/GestureHandler',
        sourceAndroidPath: 'android/src/main/java/com/swmansion/gesturehandler/react',
        targetAndroidPath: 'modules/api/components/gesturehandler/react',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
      },
      {
        sourceAndroidPath: 'android/lib/src/main/java/com/swmansion/gesturehandler',
        targetAndroidPath: 'modules/api/components/gesturehandler',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
      },
    ],
  },
  'react-native-reanimated': {
    repoUrl: 'https://github.com/kmagiera/react-native-reanimated.git',
    installableInManagedApps: true,
    steps: [
      {
        recursive: true,
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Reanimated',
        sourceAndroidPath: 'android/src/main/java/com/swmansion/reanimated',
        targetAndroidPath: 'modules/api/reanimated',
        sourceAndroidPackage: 'com.swmansion.reanimated',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.reanimated',
      },
    ],
    warnings: [
      `NOTE: Any files in ${chalk.magenta(
        'com.facebook.react'
      )} will not be updated -- you'll need to add these to ReactAndroid manually!`,
    ],
  },
  'react-native-screens': {
    repoUrl: 'https://github.com/kmagiera/react-native-screens.git',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Screens',
        sourceAndroidPath: 'android/src/main/java/com/swmansion/rnscreens',
        targetAndroidPath: 'modules/api/screens',
        sourceAndroidPackage: 'com.swmansion.rnscreens',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.screens',
      },
    ],
  },
  'react-native-appearance': {
    repoUrl: 'https://github.com/expo/react-native-appearance.git',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios/Appearance',
        targetIosPath: 'Api/Appearance',
      },
    ],
  },
  'amazon-cognito-identity-js': {
    repoUrl: 'https://github.com/aws/amazon-cognito-identity-js.git',
    installableInManagedApps: false,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Cognito',
        sourceAndroidPath: 'android/src/main/java/com/amazonaws',
        targetAndroidPath: 'modules/api/cognito',
        sourceAndroidPackage: 'com.amazonaws',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.cognito',
      },
    ],
  },
  'react-native-view-shot': {
    repoUrl: 'https://github.com/gre/react-native-view-shot.git',
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api',
        sourceAndroidPath: 'android/src/main/java/fr/greweb/reactnativeviewshot',
        targetAndroidPath: 'modules/api/viewshot',
        sourceAndroidPackage: 'fr.greweb.reactnativeviewshot',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.viewshot',
      },
    ],
  },
  'react-native-branch': {
    repoUrl: 'https://github.com/BranchMetrics/react-native-branch-deep-linking.git',
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: '../../../../packages/expo-branch/ios/EXBranch/RNBranch',
        sourceAndroidPath: 'android/src/main/java/io/branch/rnbranch',
        targetAndroidPath:
          '../../../../../../../../../packages/expo-branch/android/src/main/java/io/branch/rnbranch',
        sourceAndroidPackage: 'io.branch.rnbranch',
        targetAndroidPackage: 'io.branch.rnbranch',
        recursive: false,
        updatePbxproj: false,
      },
    ],
  },
  'lottie-react-native': {
    repoUrl: 'https://github.com/react-native-community/lottie-react-native.git',
    installableInManagedApps: true,
    steps: [
      {
        iosPrefix: 'LRN',
        sourceIosPath: 'src/ios/LottieReactNative',
        targetIosPath: 'Api/Components/Lottie',
        sourceAndroidPath: 'src/android/src/main/java/com/airbnb/android/react/lottie',
        targetAndroidPath: 'modules/api/components/lottie',
        sourceAndroidPackage: 'com.airbnb.android.react.lottie',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.lottie',
      },
    ],
  },
  'react-native-svg': {
    repoUrl: 'https://github.com/react-native-community/react-native-svg.git',
    installableInManagedApps: true,
    steps: [
      {
        recursive: true,
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/Svg',
        sourceAndroidPath: 'android/src/main/java/com/horcrux/svg',
        targetAndroidPath: 'modules/api/components/svg',
        sourceAndroidPackage: 'com.horcrux.svg',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.svg',
      },
    ],
  },
  'react-native-maps': {
    repoUrl: 'https://github.com/react-native-community/react-native-maps.git',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'lib/ios/AirGoogleMaps',
        targetIosPath: 'Api/Components/GoogleMaps',
      },
      {
        sourceIosPath: 'lib/ios/AirMaps',
        targetIosPath: 'Api/Components/Maps',
        sourceAndroidPath: 'lib/android/src/main/java/com/airbnb/android/react/maps',
        targetAndroidPath: 'modules/api/components/maps',
        sourceAndroidPackage: 'com.airbnb.android.react.maps',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.maps',
      },
    ],
  },
  'react-native-netinfo': {
    repoUrl: 'https://github.com/react-native-community/react-native-netinfo.git',
    packageName: '@react-native-community/netinfo',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/NetInfo',
        sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/netinfo',
        targetAndroidPath: 'modules/api/netinfo',
        sourceAndroidPackage: 'com.reactnativecommunity.netinfo',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.netinfo',
      },
    ],
  },
  'react-native-webview': {
    repoUrl: 'https://github.com/expo/react-native-webview.git',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/WebView',
        sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/webview',
        targetAndroidPath: 'modules/api/components/webview',
        sourceAndroidPackage: 'com.reactnativecommunity.webview',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.webview',
      },
    ],
    warnings: [
      chalk.bold.yellow(
        `\n${chalk.green('react-native-webview')} exposes ${chalk.blue(
          'useSharedPool'
        )} property which has to be handled differently in Expo Client. After upgrading this library, please ensure that proper patch is in place.`
      ),
      chalk.bold.yellow(`See commit ${chalk.cyan('0e7d25bd9facba74828a0af971293d30f9ba22fc')}.\n`),
    ],
  },
  'react-native-safe-area-context': {
    repoUrl: 'https://github.com/th3rdwave/react-native-safe-area-context',
    steps: [
      {
        sourceIosPath: 'ios/SafeAreaView',
        targetIosPath: 'Api/SafeAreaContext',
        sourceAndroidPath: 'android/src/main/java/com/th3rdwave/safeareacontext',
        targetAndroidPath: 'modules/api/safeareacontext',
        sourceAndroidPackage: 'com.th3rdwave.safeareacontext',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.safeareacontext',
      },
    ],
    warnings: [
      chalk.bold.yellow(
        `Last time checked, ${chalk.green('react-native-safe-area-context')} used ${chalk.blue(
          'androidx'
        )} which wasn't at that time supported by Expo. Please ensure that the project builds on Android after upgrading or remove this warning.`
      ),
    ],
  },
  'react-native-datetimepicker': {
    repoUrl: 'https://github.com/react-native-community/react-native-datetimepicker.git',
    packageName: '@react-native-community/datetimepicker',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/DateTimePicker',
        sourceAndroidPath: 'android/src/main/java/com/reactcommunity/rndatetimepicker',
        targetAndroidPath: 'modules/api/components/datetimepicker',
        sourceAndroidPackage: 'com.reactcommunity.rndatetimepicker',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.datetimepicker',
      },
    ],
  },
  'react-native-shared-element': {
    repoUrl: 'https://github.com/IjzerenHein/react-native-shared-element',
    packageName: 'react-native-shared-element',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/SharedElement',
        sourceAndroidPath: 'android/src/main/java/com/ijzerenhein/sharedelement',
        targetAndroidPath: 'modules/api/components/sharedelement',
        sourceAndroidPackage: 'com.ijzerenhein.sharedelement',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.sharedelement',
      },
    ],
  },
};

async function getBundledNativeModulesAsync(): Promise<{ [key: string]: string }> {
  return (await JsonFile.readAsync(BUNDLED_NATIVE_MODULES_PATH)) as { [key: string]: string };
}

async function updateBundledNativeModulesAsync(updater) {
  console.log(`\nUpdating ${chalk.magenta('bundledNativeModules.json')} ...`);

  const jsonFile = new JsonFile(BUNDLED_NATIVE_MODULES_PATH);
  const data = await jsonFile.readAsync();
  await jsonFile.writeAsync(await updater(data));
}

async function renameIOSSymbolsAsync(file: string, iosPrefix: string) {
  const content = await fs.readFile(file, 'utf8');

  // Do something more sophisticated if this causes issues with more complex modules.
  const transformedContent = content.replace(new RegExp(iosPrefix, 'g'), 'EX');
  const newFileName = file.replace(iosPrefix, 'EX');

  await fs.writeFile(newFileName, transformedContent, 'utf8');
  await fs.remove(file);
}

async function findObjcFilesAsync(dir: string, recursive: boolean): Promise<string[]> {
  const pattern = path.join(dir, recursive ? '**' : '', '*.[hmc]');
  return await glob(pattern);
}

async function renamePackageAndroidAsync(
  file: string,
  sourceAndroidPackage: string,
  targetAndroidPackage: string
) {
  const content = await fs.readFile(file, 'utf8');

  // Note: this only works for a single package. If react-native-svg separates
  // its code into multiple packages we will have to do something more
  // sophisticated here.
  const transformedContent = content.replace(
    new RegExp(sourceAndroidPackage, 'g'),
    targetAndroidPackage
  );

  await fs.writeFile(file, transformedContent, 'utf8');
}

async function findAndroidFilesAsync(dir: string): Promise<string[]> {
  const pattern = path.join(dir, '**', '*.@(java|kt)');
  return await glob(pattern);
}

async function loadXcodeprojFileAsync(file: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pbxproj = xcode.project(file);
    pbxproj.parse(err => (err ? reject(err) : resolve(pbxproj)));
  });
}

function pbxGroupChild(file) {
  const obj = Object.create(null);
  obj.value = file.fileRef;
  obj.comment = file.basename;
  return obj;
}

function pbxGroupHasChildWithRef(group: any, ref: string): boolean {
  return group.children.some(child => child.value === ref);
}

async function addFileToPbxprojAsync(
  filePath: string,
  targetDir: string,
  pbxproj: any
): Promise<void> {
  const fileName = path.basename(filePath);

  // The parent group of the target directory that should already be created in the project, e.g. `Components` or `Api`.
  const targetGroup = pbxproj.pbxGroupByName(path.basename(path.dirname(targetDir)));

  if (!pbxproj.hasFile(fileName)) {
    console.log(`Adding ${chalk.magenta(fileName)} to pbxproj configuration ...`);

    const fileOptions = {
      // Mute warnings from 3rd party modules.
      compilerFlags: '-w',
    };

    // The group name is mostly just a basename of the path.
    const groupName = path.basename(path.dirname(filePath));

    // Add a file to pbxproj tree.
    const file =
      path.extname(fileName) === '.h'
        ? pbxproj.addHeaderFile(fileName, fileOptions, groupName)
        : pbxproj.addSourceFile(fileName, fileOptions, groupName);

    // Search for the group where the file should be placed.
    const group = pbxproj.pbxGroupByName(groupName);

    // Our files has `includeInIndex` set to 1, so let's continue doing that.
    file.includeInIndex = 1;

    if (group) {
      // Add a file if it is not there already.
      if (!pbxGroupHasChildWithRef(group, file.fileRef)) {
        group.children.push(pbxGroupChild(file));
      }
    } else {
      // Create a pbx group with this file.
      const { uuid } = pbxproj.addPbxGroup([file.path], groupName, groupName);

      // Add newly created group to the parent group.
      if (!pbxGroupHasChildWithRef(targetGroup, uuid)) {
        targetGroup.children.push(pbxGroupChild({ fileRef: uuid, basename: groupName }));
      }
    }
  }
}

async function copyFilesAsync(
  files: string[],
  sourceDir: string,
  targetDir: string
): Promise<void> {
  for (const file of files) {
    const fileRelativePath = path.relative(sourceDir, file);
    const fileTargetPath = path.join(targetDir, fileRelativePath);

    await fs.mkdirs(path.dirname(fileTargetPath));
    await fs.copy(file, fileTargetPath);

    console.log(chalk.yellow('>'), chalk.magenta(path.relative(targetDir, fileTargetPath)));
  }
}

async function action(options: ActionOptions) {
  if (options.list) {
    const bundledNativeModules = await getBundledNativeModulesAsync();

    for (const vendoredModuleName in vendoredModulesConfig) {
      const moduleConfig = vendoredModulesConfig[vendoredModuleName];
      const currentBundledVersion =
        bundledNativeModules[moduleConfig.packageName || vendoredModuleName];

      console.log(chalk.bold.green(vendoredModuleName));
      console.log(chalk.yellow('>'), 'repository:', chalk.magenta(moduleConfig.repoUrl));
      console.log(
        chalk.yellow('>'),
        'current bundled version:',
        (currentBundledVersion ? chalk.cyan : chalk.gray)(currentBundledVersion)
      );
      console.log();
    }
    return;
  }

  if (!options.module) {
    throw new Error('Must be run with `--module <module_name>`.');
  }

  const moduleConfig = vendoredModulesConfig[options.module];

  if (!moduleConfig) {
    throw new Error(
      `Config for module ${chalk.green(
        options.module
      )} not found. Run with \`--list\` to show a list of available 3rd party modules`
    );
  }

  moduleConfig.installableInManagedApps =
    moduleConfig.installableInManagedApps == null ? true : moduleConfig.installableInManagedApps;

  const tmpDir = path.join(os.tmpdir(), options.module);

  // Cleanup tmp dir.
  await fs.remove(tmpDir);

  console.log(
    `Cloning ${chalk.green(options.module)}${chalk.red('#')}${chalk.cyan(
      options.commit
    )} from GitHub ...`
  );

  // Clone the repository.
  await spawnAsync('git', ['clone', moduleConfig.repoUrl, tmpDir]);

  // Checkout at given commit (defaults to master).
  await spawnAsync('git', ['checkout', options.commit], { cwd: tmpDir });

  if (moduleConfig.warnings) {
    moduleConfig.warnings.forEach(warning => console.warn(warning));
  }

  for (const step of moduleConfig.steps) {
    const executeAndroid = ['all', 'android'].includes(options.platform);
    const executeIOS = ['all', 'ios'].includes(options.platform);

    step.recursive = step.recursive === true;
    step.updatePbxproj = !(step.updatePbxproj === false);

    // iOS
    if (executeIOS && step.sourceIosPath && step.targetIosPath) {
      const sourceDir = path.join(tmpDir, step.sourceIosPath);
      const targetDir = path.join(IOS_DIR, 'Exponent', 'Versioned', 'Core', step.targetIosPath);

      console.log(
        `\nCleaning up iOS files at ${chalk.magenta(path.relative(IOS_DIR, targetDir))} ...`
      );

      await fs.remove(targetDir);
      await fs.mkdirs(targetDir);

      console.log('\nCopying iOS files ...');

      const objcFiles = await findObjcFilesAsync(sourceDir, step.recursive);
      const pbxprojPath = path.join(IOS_DIR, 'Exponent.xcodeproj', 'project.pbxproj');
      const pbxproj = await loadXcodeprojFileAsync(pbxprojPath);

      await copyFilesAsync(objcFiles, sourceDir, targetDir);

      if (options.pbxproj && step.updatePbxproj) {
        console.log(`\nUpdating pbxproj configuration ...`);

        for (const file of objcFiles) {
          const fileRelativePath = path.relative(sourceDir, file);
          const fileTargetPath = path.join(targetDir, fileRelativePath);

          await addFileToPbxprojAsync(fileTargetPath, targetDir, pbxproj);
        }

        console.log(
          `Saving updated pbxproj structure to the file ${chalk.magenta(
            path.relative(IOS_DIR, pbxprojPath)
          )} ...`
        );
        await fs.writeFile(pbxprojPath, pbxproj.writeSync());
      }

      if (step.iosPrefix) {
        console.log(
          `\nUpdating classes prefix from ${chalk.yellow(step.iosPrefix)} to ${chalk.yellow(
            'EX'
          )} ...`
        );

        const files = await findObjcFilesAsync(targetDir, step.recursive);

        for (const file of files) {
          await renameIOSSymbolsAsync(file, step.iosPrefix);
        }
      }

      console.log(
        chalk.yellow(
          `\nSuccessfully updated iOS files, but please make sure Xcode project files are setup correctly in ${chalk.magenta(
            `Exponent/Versioned/Core/${step.targetIosPath}`
          )}`
        )
      );
    }

    // Android
    if (
      executeAndroid &&
      step.sourceAndroidPath &&
      step.targetAndroidPath &&
      step.sourceAndroidPackage &&
      step.targetAndroidPackage
    ) {
      const sourceDir = path.join(tmpDir, step.sourceAndroidPath);
      const targetDir = path.join(
        ANDROID_DIR,
        'expoview',
        'src',
        'main',
        'java',
        'versioned',
        'host',
        'exp',
        'exponent',
        step.targetAndroidPath
      );

      console.log(
        `\nCleaning up Android files at ${chalk.magenta(path.relative(ANDROID_DIR, targetDir))} ...`
      );

      await fs.remove(targetDir);
      await fs.mkdirs(targetDir);

      console.log('\nCopying Android files ...');

      const javaFiles = await findAndroidFilesAsync(sourceDir);

      await copyFilesAsync(javaFiles, sourceDir, targetDir);

      const files = await findAndroidFilesAsync(targetDir);

      for (const file of files) {
        await renamePackageAndroidAsync(file, step.sourceAndroidPackage, step.targetAndroidPackage);
      }
    }
  }

  await updateBundledNativeModulesAsync(async bundledNativeModules => {
    const { name, version } = (await JsonFile.readAsync(path.join(tmpDir, 'package.json'))) as {
      name: string;
      version: string;
    };

    if (moduleConfig.installableInManagedApps) {
      bundledNativeModules[name] = `~${version}`;
      console.log(
        `Updated ${chalk.green(name)} version number in ${chalk.magenta(
          'bundledNativeModules.json'
        )}`
      );
    } else if (bundledNativeModules[name]) {
      delete bundledNativeModules[name];
      console.log(
        `Removed non-installable package ${chalk.green(name)} from ${chalk.magenta(
          'bundledNativeModules.json'
        )}`
      );
    }
    return bundledNativeModules;
  });

  console.log(
    `\nFinished updating ${chalk.green(
      options.module
    )}, make sure to update files in the Xcode project (if you updated iOS, see logs above) and test that it still works. 🙂`
  );
}

export default (program: Command) => {
  program
    .command('update-vendored-module')
    .alias('update-module')
    .description('Updates 3rd party modules.')
    .option('-l, --list', 'Shows a list of available 3rd party modules.', false)
    .option('-m, --module <string>', 'Name of the module to update.')
    .option(
      '-p, --platform <string>',
      'A platform on which the vendored module will be updated.',
      'all'
    )
    .option(
      '-c, --commit <string>',
      'Git reference on which to checkout when copying 3rd party module.',
      'master'
    )
    .option('--no-pbxproj', 'Whether to skip updating project.pbxproj file.', false)
    .asyncAction(action);
};
