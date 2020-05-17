import os from 'os';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import xcode from 'xcode';
import semver from 'semver';
import inquirer from 'inquirer';
import glob from 'glob-promise';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import { Command } from '@expo/commander';

import * as Directories from '../Directories';
import * as Npm from '../Npm';

interface ActionOptions {
  list: boolean;
  listOutdated: boolean;
  module: string;
  platform: 'ios' | 'android' | 'all';
  commit: string;
  pbxproj: boolean;
  semverPrefix: string;
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
  semverPrefix?: '~' | '^';
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
    repoUrl: 'https://github.com/software-mansion/react-native-gesture-handler.git',
    installableInManagedApps: true,
    semverPrefix: '~',
    steps: [
      {
        sourceAndroidPath: 'android/lib/src/main/java/com/swmansion/gesturehandler',
        targetAndroidPath: 'modules/api/components/gesturehandler',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
      },
      {
        recursive: true,
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/GestureHandler',
        sourceAndroidPath: 'android/src/main/java/com/swmansion/gesturehandler/react',
        targetAndroidPath: 'modules/api/components/gesturehandler/react',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
      },
    ],
    warnings: [
      `NOTE: Any files in ${chalk.magenta(
        'com.facebook.react'
      )} will not be updated -- you'll need to add these to expoview manually!`,
    ],
  },
  'react-native-reanimated': {
    repoUrl: 'https://github.com/software-mansion/react-native-reanimated.git',
    installableInManagedApps: true,
    semverPrefix: '~',
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
      )} will not be updated -- you'll need to add these to expoview manually!`,
    ],
  },
  'react-native-screens': {
    repoUrl: 'https://github.com/software-mansion/react-native-screens.git',
    installableInManagedApps: true,
    semverPrefix: '~',
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
    semverPrefix: '~',
    steps: [
      {
        sourceIosPath: 'ios/Appearance',
        targetIosPath: 'Api/Appearance',
        sourceAndroidPath: 'android/src/main/java/io/expo/appearance',
        targetAndroidPath: 'modules/api/appearance/rncappearance',
        sourceAndroidPackage: 'io.expo.appearance',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.appearance.rncappearance',
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
        targetIosPath: 'Api/ViewShot',
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
        recursive: true,
        sourceIosPath: 'lib/ios/AirMaps',
        targetIosPath: 'Api/Components/Maps',
        sourceAndroidPath: 'lib/android/src/main/java/com/airbnb/android/react/maps',
        targetAndroidPath: 'modules/api/components/maps',
        sourceAndroidPackage: 'com.airbnb.android.react.maps',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.maps',
      },
    ],
  },
  '@react-native-community/netinfo': {
    repoUrl: 'https://github.com/react-native-community/react-native-netinfo.git',
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
    repoUrl: 'https://github.com/react-native-community/react-native-webview.git',
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
  '@react-native-community/datetimepicker': {
    repoUrl: 'https://github.com/react-native-community/react-native-datetimepicker.git',
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
  '@react-native-community/masked-view': {
    repoUrl: 'https://github.com/react-native-community/react-native-masked-view',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/MaskedView',
        sourceAndroidPath: 'android/src/main/java/org/reactnative/maskedview',
        targetAndroidPath: 'modules/api/components/maskedview',
        sourceAndroidPackage: 'org.reactnative.maskedview',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.maskedview',
      },
    ],
  },
  '@react-native-community/viewpager': {
    repoUrl: 'https://github.com/react-native-community/react-native-viewpager',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/ViewPager',
        sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/viewpager',
        targetAndroidPath: 'modules/api/components/viewpager',
        sourceAndroidPackage: 'com.reactnativecommunity.viewpager',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.viewpager',
      },
    ],
  },
  'react-native-shared-element': {
    repoUrl: 'https://github.com/IjzerenHein/react-native-shared-element',
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
    pbxproj.parse((err) => (err ? reject(err) : resolve(pbxproj)));
  });
}

function pbxGroupChild(file) {
  const obj = Object.create(null);
  obj.value = file.fileRef;
  obj.comment = file.basename;
  return obj;
}

function pbxGroupHasChildWithRef(group: any, ref: string): boolean {
  return group.children.some((child) => child.value === ref);
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

async function listAvailableVendoredModulesAsync(onlyOutdated: boolean = false) {
  const bundledNativeModules = await getBundledNativeModulesAsync();
  const vendoredPackageNames = Object.keys(vendoredModulesConfig);
  const packageViews: Npm.PackageViewType[] = await Promise.all(
    vendoredPackageNames.map((packageName: string) => Npm.getPackageViewAsync(packageName))
  );

  for (const packageName of vendoredPackageNames) {
    const packageView = packageViews.shift();

    if (!packageView) {
      console.error(
        chalk.red.bold(`Couldn't get package view for ${chalk.green.bold(packageName)}.\n`)
      );
      continue;
    }

    const moduleConfig = vendoredModulesConfig[packageName];
    const bundledVersion = bundledNativeModules[packageName];
    const latestVersion = packageView.versions[packageView.versions.length - 1];

    if (!onlyOutdated || !bundledVersion || semver.gtr(latestVersion, bundledVersion)) {
      console.log(chalk.bold.green(packageName));
      console.log(`${chalk.yellow('>')} repository     : ${chalk.magenta(moduleConfig.repoUrl)}`);
      console.log(
        `${chalk.yellow('>')} bundled version: ${(bundledVersion ? chalk.cyan : chalk.gray)(
          bundledVersion
        )}`
      );
      console.log(`${chalk.yellow('>')} latest version : ${chalk.cyan(latestVersion)}`);
      console.log();
    }
  }
}

async function askForModuleAsync(): Promise<string> {
  const { moduleName } = await inquirer.prompt<{ moduleName: string }>([
    {
      type: 'list',
      name: 'moduleName',
      message: 'Which 3rd party module would you like to update?',
      choices: Object.keys(vendoredModulesConfig),
    },
  ]);
  return moduleName;
}

async function getPackageJsonPathsAsync(): Promise<string[]> {
  const packageJsonPath = path.join(Directories.getAppsDir(), '**', 'package.json');
  return await glob(packageJsonPath, { ignore: '**/node_modules/**' });
}

async function updateWorkspaceDependencies(
  dependencyName: string,
  versionRange: string
): Promise<boolean> {
  const paths = await getPackageJsonPathsAsync();
  const results = await Promise.all(
    paths.map((path) => updateDependencyAsync(path, dependencyName, versionRange))
  );
  return results.some(Boolean);
}

async function updateHomeDependencies(
  dependencyName: string,
  versionRange: string
): Promise<boolean> {
  const packageJsonPath = path.join(Directories.getExpoHomeJSDir(), 'package.json');
  return await updateDependencyAsync(packageJsonPath, dependencyName, versionRange);
}

async function updateDependencyAsync(
  packageJsonPath: string,
  dependencyName: string,
  newVersionRange: string
): Promise<boolean> {
  const jsonFile = new JsonFile(packageJsonPath);
  const packageJson = await jsonFile.readAsync();

  const dependencies = (packageJson || {}).dependencies || {};
  if (dependencies[dependencyName] && dependencies[dependencyName] !== newVersionRange) {
    console.log(
      `${chalk.yellow('>')} ${chalk.green(packageJsonPath)}: ${chalk.magentaBright(
        dependencies[dependencyName]
      )} -> ${chalk.magentaBright(newVersionRange)}`
    );
    dependencies[dependencyName] = newVersionRange;
    await jsonFile.writeAsync(packageJson);
    return true;
  }
  return false;
}

async function action(options: ActionOptions) {
  if (options.list || options.listOutdated) {
    await listAvailableVendoredModulesAsync(options.listOutdated);
    return;
  }

  const moduleName = options.module || (await askForModuleAsync());
  const moduleConfig = vendoredModulesConfig[moduleName];

  if (!moduleConfig) {
    throw new Error(
      `Module \`${chalk.green(
        moduleName
      )}\` doesn't match any of currently supported 3rd party modules. Run with \`--list\` to show a list of modules.`
    );
  }

  moduleConfig.installableInManagedApps =
    moduleConfig.installableInManagedApps == null ? true : moduleConfig.installableInManagedApps;

  const tmpDir = path.join(os.tmpdir(), moduleName);

  // Cleanup tmp dir.
  await fs.remove(tmpDir);

  console.log(
    `Cloning ${chalk.green(moduleName)}${chalk.red('#')}${chalk.cyan(
      options.commit
    )} from GitHub ...`
  );

  // Clone the repository.
  await spawnAsync('git', ['clone', moduleConfig.repoUrl, tmpDir]);

  // Checkout at given commit (defaults to master).
  await spawnAsync('git', ['checkout', options.commit], { cwd: tmpDir });

  if (moduleConfig.warnings) {
    moduleConfig.warnings.forEach((warning) => console.warn(warning));
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

  const { name, version } = await JsonFile.readAsync<{
    name: string;
    version: string;
  }>(path.join(tmpDir, 'package.json'));
  const semverPrefix =
    (options.semverPrefix != null ? options.semverPrefix : moduleConfig.semverPrefix) || '';
  const versionRange = `${semverPrefix}${version}`;

  await updateBundledNativeModulesAsync(async (bundledNativeModules) => {
    if (moduleConfig.installableInManagedApps) {
      bundledNativeModules[name] = versionRange;
      console.log(
        `Updated ${chalk.green(name)} in ${chalk.magenta(
          'bundledNativeModules.json'
        )} to version range ${chalk.cyan(versionRange)}`
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

  console.log(`\nUpdating ${chalk.green(name)} in workspace projects...`);
  const homeWasUpdated = await updateHomeDependencies(name, versionRange);
  const workspaceWasUpdated = await updateWorkspaceDependencies(name, versionRange);

  // We updated dependencies so we need to run yarn.
  if (homeWasUpdated || workspaceWasUpdated) {
    console.log(`\nRunning \`${chalk.cyan(`yarn`)}\`...`);
    await spawnAsync('yarn', [], {
      cwd: Directories.getExpoRepositoryRootDir(),
    });
  }

  if (homeWasUpdated) {
    console.log(`\nHome dependencies were updated. You need to publish the new dev home version.`);
  }

  console.log(
    `\nFinished updating ${chalk.green(
      moduleName
    )}, make sure to update files in the Xcode project (if you updated iOS, see logs above) and test that it still works. 🙂`
  );
}

export default (program: Command) => {
  program
    .command('update-vendored-module')
    .alias('update-module', 'uvm')
    .description('Updates 3rd party modules.')
    .option('-l, --list', 'Shows a list of available 3rd party modules.', false)
    .option('-o, --list-outdated', 'Shows a list of outdated 3rd party modules.', false)
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
    .option(
      '-s, --semver-prefix <string>',
      'Setting this flag forces to use given semver prefix. Some modules may specify them by the config, but in case we want to update to alpha/beta versions we should use an empty prefix to be more strict.',
      null
    )
    .option('--no-pbxproj', 'Whether to skip updating project.pbxproj file.', false)
    .asyncAction(action);
};
