import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import xcode from 'xcode';
import glob from 'glob-promise';
import ncp from 'ncp';

import * as Directories from '../Directories';
import { EXPO_DIR } from '../Constants';

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

type ModuleModifier = (
  moduleConfig: VendoredModuleConfig,
  clonedProjectPath: string
) => Promise<void>;

interface VendoredModuleConfig {
  repoUrl: string;
  packageName?: string;
  packageJsonPath?: string;
  installableInManagedApps?: boolean;
  semverPrefix?: '~' | '^';
  skipCleanup?: boolean;
  steps: VendoredModuleUpdateStep[];
  moduleModifier?: ModuleModifier;
  warnings?: string[];
}

const IOS_DIR = Directories.getIosDir();
const ANDROID_DIR = Directories.getAndroidDir();

const SvgModifier: ModuleModifier = async function (
  moduleConfig: VendoredModuleConfig,
  clonedProjectPath: string
): Promise<void> {
  const removeMacFiles = async () => {
    const macPattern = path.join(clonedProjectPath, 'apple', '**', '*.macos.@(h|m)');
    const macFiles = await glob(macPattern);
    for (const file of macFiles) {
      await fs.remove(file);
    }
  };

  const addHeaderImport = async () => {
    const targetPath = path.join(clonedProjectPath, 'apple', 'Text', 'RNSVGTopAlignedLabel.h');
    const content = await fs.readFile(targetPath, 'utf8');
    const transformedContent = `#import "RNSVGUIKit.h"\n${content}`;
    await fs.writeFile(targetPath, transformedContent, 'utf8');
  };

  await removeMacFiles();
  await addHeaderImport();
};

const ReanimatedModifier: ModuleModifier = async function (
  moduleConfig: VendoredModuleConfig,
  clonedProjectPath: string
): Promise<void> {
  const firstStep = moduleConfig.steps[0];
  const androidMainPathReanimated = path.join(clonedProjectPath, 'android', 'src', 'main');
  const androidMainPathExpoview = path.join(ANDROID_DIR, 'expoview', 'src', 'main');
  const JNIOldPackagePrefix = firstStep.sourceAndroidPackage!.split('.').join('/');
  const JNINewPackagePrefix = firstStep.targetAndroidPackage!.split('.').join('/');

  const replaceHermesByJSC = async () => {
    const nativeProxyPath = path.join(
      clonedProjectPath,
      'android',
      'src',
      'main',
      'cpp',
      'NativeProxy.cpp'
    );
    const runtimeCreatingLineJSC = 'jsc::makeJSCRuntime();';
    const jscImportingLine = '#include <jsi/JSCRuntime.h>';
    const runtimeCreatingLineHermes = 'facebook::hermes::makeHermesRuntime();';
    const hermesImportingLine = '#include <hermes/hermes.h>';

    const content = await fs.readFile(nativeProxyPath, 'utf8');
    let transformedContent = content.replace(runtimeCreatingLineHermes, runtimeCreatingLineJSC);
    transformedContent = transformedContent.replace(
      new RegExp(hermesImportingLine, 'g'),
      jscImportingLine
    );

    await fs.writeFile(nativeProxyPath, transformedContent, 'utf8');
  };

  const replaceJNIPackages = async () => {
    const cppPattern = path.join(androidMainPathReanimated, 'cpp', '**', '*.@(h|cpp)');
    const androidCpp = await glob(cppPattern);
    for (const file of androidCpp) {
      const content = await fs.readFile(file, 'utf8');
      const transformedContent = content.split(JNIOldPackagePrefix).join(JNINewPackagePrefix);
      await fs.writeFile(file, transformedContent, 'utf8');
    }
  };

  const copyCPP = async () => {
    const dirs = ['Common', 'cpp'];
    for (let dir of dirs) {
      await fs.remove(path.join(androidMainPathExpoview, dir)); // clean
      // copy
      await new Promise<void>((res, rej) => {
        ncp(
          path.join(androidMainPathReanimated, dir),
          path.join(androidMainPathExpoview, dir),
          { dereference: true },
          () => {
            res();
          }
        );
      });
    }
  };

  const prepareIOSNativeFiles = async () => {
    const patternCommon = path.join(clonedProjectPath, 'Common', '**', '*.@(h|mm|cpp)');
    const patternNative = path.join(clonedProjectPath, 'ios', 'native', '**', '*.@(h|mm|cpp)');
    const commonFiles = await glob(patternCommon);
    const iosOnlyFiles = await glob(patternNative);
    const files = [...commonFiles, ...iosOnlyFiles];
    for (let file of files) {
      console.log(file);
      const fileName = file.split(path.sep).slice(-1)[0];
      await fs.copy(file, path.join(clonedProjectPath, 'ios', fileName));
    }

    await fs.remove(path.join(clonedProjectPath, 'ios', 'native'));
  };

  await replaceHermesByJSC();
  await replaceJNIPackages();
  await copyCPP();
  await prepareIOSNativeFiles();
};

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
    moduleModifier: ReanimatedModifier,
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
      `NOTE: Some imports have to be changed from ${chalk.magenta('<>')} form to 
      ${chalk.magenta('""')}`,
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
    repoUrl: 'https://github.com/aws-amplify/amplify-js.git',
    installableInManagedApps: false,
    steps: [
      {
        sourceIosPath: 'packages/amazon-cognito-identity-js/ios',
        targetIosPath: 'Api/Cognito',
        sourceAndroidPath:
          'packages/amazon-cognito-identity-js/android/src/main/java/com/amazonaws',
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
    moduleModifier: SvgModifier,
    steps: [
      {
        recursive: true,
        sourceIosPath: 'apple',
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
        sourceIosPath: 'apple',
        targetIosPath: 'Api/Components/WebView',
        sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/webview',
        targetAndroidPath: 'modules/api/components/webview',
        sourceAndroidPackage: 'com.reactnativecommunity.webview',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.webview',
      },
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
    warnings: [
      `NOTE: In Expo, native Android styles are prefixed with ${chalk.magenta(
        'ReactAndroid'
      )}. Please ensure that ${chalk.magenta(
        'resourceName'
      )}s used for grabbing style of dialogs are being resolved properly.`,
    ],
  },
  '@react-native-masked-view/masked-view': {
    repoUrl: 'https://github.com/react-native-masked-view/masked-view',
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
  'react-native-pager-view': {
    repoUrl: 'https://github.com/callstack/react-native-pager-view',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/PagerView',
        sourceAndroidPath: 'android/src/main/java/com/reactnativepagerview/',
        targetAndroidPath: 'modules/api/components/pagerview',
        sourceAndroidPackage: 'com.reactnativepagerview',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.pagerview',
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
  '@react-native-segmented-control/segmented-control': {
    repoUrl: 'https://github.com/react-native-segmented-control/segmented-control',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/SegmentedControl',
      },
    ],
  },
  '@react-native-picker/picker': {
    repoUrl: 'https://github.com/react-native-picker/picker',
    installableInManagedApps: true,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Components/Picker',
        sourceAndroidPath: 'android/src/main/java/com/reactnativecommunity/picker',
        targetAndroidPath: 'modules/api/components/picker',
        sourceAndroidPackage: 'com.reactnativecommunity.picker',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.picker',
      },
    ],
  },
  '@react-native-community/slider': {
    repoUrl: 'https://github.com/react-native-community/react-native-slider',
    installableInManagedApps: true,
    packageJsonPath: 'src',
    steps: [
      {
        sourceIosPath: 'src/ios',
        targetIosPath: 'Api/Components/Slider',
        sourceAndroidPath: 'src/android/src/main/java/com/reactnativecommunity/slider',
        targetAndroidPath: 'modules/api/components/slider',
        sourceAndroidPackage: 'com.reactnativecommunity.slider',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.slider',
      },
    ],
  },
  '@stripe/stripe-react-native': {
    repoUrl: 'https://github.com/stripe/stripe-react-native',
    installableInManagedApps: true,
    steps: [
      {
        sourceAndroidPath: 'android/src/main/java/com/reactnativestripesdk',
        targetAndroidPath: 'modules/api/components/reactnativestripesdk',
        sourceAndroidPackage: 'com.reactnativestripesdk',
        targetAndroidPackage:
          'versioned.host.exp.exponent.modules.api.components.reactnativestripesdk',
      },
    ],
  },
};

async function renameIOSSymbolsAsync(file: string, iosPrefix: string) {
  const content = await fs.readFile(file, 'utf8');

  // Do something more sophisticated if this causes issues with more complex modules.
  const transformedContent = content.replace(new RegExp(iosPrefix, 'g'), 'EX');
  const newFileName = file.replace(iosPrefix, 'EX');

  await fs.writeFile(newFileName, transformedContent, 'utf8');
  await fs.remove(file);
}

async function findObjcFilesAsync(dir: string, recursive: boolean): Promise<string[]> {
  const pattern = path.join(dir, recursive ? '**' : '', '*.@(h|m|c|mm|cpp|swift)');
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

    console.log(chalk.yellow('>'), chalk.magenta(path.relative(EXPO_DIR, fileTargetPath)));
  }
}

export async function legacyVendorModuleAsync(
  moduleName: string,
  platform: string,
  tmpDir: string
) {
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

  if (moduleConfig.warnings) {
    moduleConfig.warnings.forEach((warning) => console.warn(warning));
  }

  if (moduleConfig.moduleModifier) {
    await moduleConfig.moduleModifier(moduleConfig, tmpDir);
  }

  for (const step of moduleConfig.steps) {
    const executeAndroid = ['all', 'android'].includes(platform);
    const executeIOS = ['all', 'ios'].includes(platform);

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

      if (step.updatePbxproj) {
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
        console.log(`\nUpdating classes prefix to ${chalk.yellow(step.iosPrefix)} ...`);

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
}
