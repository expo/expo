import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import ncp from 'ncp';
import path from 'path';
import xcode from 'xcode';

import { EXPO_DIR } from '../Constants';
import * as Directories from '../Directories';

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

  // should cleanup target path before vendoring
  cleanupTargetPath?: boolean;

  /**
   * Hook that is fired by the end of vendoring an Android file.
   * You should use it to perform some extra operations that are not covered by the main flow.
   * @deprecated Use {@link VendoredModuleConfig.moduleModifier} instead.
   */
  onDidVendorAndroidFile?: (file: string) => Promise<void>;
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
  /**
   * These modifiers are run before files are copied to the target directory.
   */
  moduleModifier?: ModuleModifier;
  warnings?: string[];
}

const IOS_DIR = Directories.getExpoGoIosDir();
const ANDROID_DIR = Directories.getExpoGoAndroidDir();

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
    for (const dir of dirs) {
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
    for (const file of files) {
      console.log(file);
      const fileName = file.split(path.sep).slice(-1)[0];
      await fs.copy(file, path.join(clonedProjectPath, 'ios', fileName));
    }

    await fs.remove(path.join(clonedProjectPath, 'ios', 'native'));
  };

  const transformGestureHandlerImports = async () => {
    const javaFiles = await glob(path.join(clonedProjectPath, 'android', '**', '*.java'));
    await Promise.all(
      javaFiles.map(async (file) => {
        let content = await fs.readFile(file, 'utf8');
        content = content.replace(
          /^import com\.swmansion\.common\./gm,
          'import versioned.host.exp.exponent.modules.api.components.gesturehandler.'
        );
        await fs.writeFile(file, content);
      })
    );
  };

  const applyRNVersionPatches = async () => {
    const rnVersion = '0.67.2';
    const patchVersion = rnVersion.split('.')[1];
    const patchSourceDir = path.join(clonedProjectPath, 'android', 'rnVersionPatch', patchVersion);
    const javaFiles = await glob('**/*.java', {
      cwd: patchSourceDir,
    });
    await Promise.all(
      javaFiles.map(async (file) => {
        const srcPath = path.join(patchSourceDir, file);
        const dstPath = path.join(
          clonedProjectPath,
          'android',
          'src',
          'main',
          'java',
          'com',
          'swmansion',
          'reanimated',
          file
        );
        await fs.copy(srcPath, dstPath);
      })
    );
  };

  await applyRNVersionPatches();
  await replaceJNIPackages();
  await copyCPP();
  await prepareIOSNativeFiles();
  await transformGestureHandlerImports();
};

const GestureHandlerModifier: ModuleModifier = async function (
  moduleConfig: VendoredModuleConfig,
  clonedProjectPath: string
): Promise<void> {
  const addResourceImportAsync = async () => {
    const files = [
      `${clonedProjectPath}/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerButtonViewManager.kt`,
    ];
    await Promise.all(
      files
        .map((file) => path.resolve(file))
        .map(async (file) => {
          let content = await fs.readFile(file, 'utf8');
          content = content.replace(/^(package .+)$/gm, '$1\nimport host.exp.expoview.R');
          await fs.writeFile(file, content, 'utf8');
        })
    );
  };

  const replaceOrAddBuildConfigImportAsync = async () => {
    const files = [
      `${clonedProjectPath}/android/lib/src/main/java/com/swmansion/gesturehandler/GestureHandler.kt`,
      `${clonedProjectPath}/android/src/main/java/com/swmansion/gesturehandler/RNGestureHandlerPackage.kt`,
      `${clonedProjectPath}/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerModule.kt`,
    ];
    await Promise.all(
      files
        .map((file) => path.resolve(file))
        .map(async (file) => {
          let content = await fs.readFile(file, 'utf8');
          content = content
            .replace(/^.*\.BuildConfig$/gm, '')
            .replace(/^(package .+)$/gm, '$1\nimport host.exp.expoview.BuildConfig');
          await fs.writeFile(file, content, 'utf8');
        })
    );
  };

  const transformImportsAsync = async () => {
    const files = [
      `${clonedProjectPath}/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerModule.kt`,
    ];
    await Promise.all(
      files
        .map((file) => path.resolve(file))
        .map(async (file) => {
          let content = await fs.readFile(file, 'utf8');
          content = content.replace(
            /^import com\.swmansion\.common\./gm,
            'import versioned.host.exp.exponent.modules.api.components.gesturehandler.'
          );
          await fs.writeFile(file, content, 'utf8');
        })
    );
  };

  const commentOurReanimatedCode = async () => {
    const files = [
      `${clonedProjectPath}/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerModule.kt`,
    ];
    await Promise.all(
      files
        .map((file) => path.resolve(file))
        .map(async (file) => {
          let content = await fs.readFile(file, 'utf8');
          content = content.replace(
            'ReanimatedEventDispatcher.sendEvent(event, reactApplicationContext)',
            '// $& // COMMENTED OUT BY VENDORING SCRIPT'
          );
          await fs.writeFile(file, content, 'utf8');
        })
    );
  };

  await addResourceImportAsync();
  await replaceOrAddBuildConfigImportAsync();
  await transformImportsAsync();
  await commentOurReanimatedCode();
};

const ScreensModifier: ModuleModifier = async function (
  moduleConfig: VendoredModuleConfig,
  clonedProjectPath: string
): Promise<void> {
  const viewmanagersExpoviewDir = path.join(
    ANDROID_DIR,
    'expoview',
    'src',
    'main',
    'java',
    'com',
    'facebook',
    'react',
    'viewmanagers'
  );

  const copyPaperViewManager = async () => {
    await fs.remove(viewmanagersExpoviewDir); // clean
    // copy
    await new Promise<void>((res, rej) => {
      ncp(
        path.join(
          clonedProjectPath,
          'android',
          'src',
          'paper',
          'java',
          'com',
          'facebook',
          'react',
          'viewmanagers'
        ),
        viewmanagersExpoviewDir,
        { dereference: true },
        () => {
          res();
        }
      );
    });
  };

  await copyPaperViewManager();
};

const vendoredModulesConfig: { [key: string]: VendoredModuleConfig } = {
  'react-native-gesture-handler': {
    repoUrl: 'https://github.com/software-mansion/react-native-gesture-handler.git',
    installableInManagedApps: true,
    semverPrefix: '~',
    moduleModifier: GestureHandlerModifier,
    steps: [
      {
        sourceAndroidPath: 'android/src/main/java/com/swmansion/gesturehandler',
        targetAndroidPath: 'modules/api/components/gesturehandler',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
      },
      {
        sourceAndroidPath: 'android/lib/src/main/java/com/swmansion/gesturehandler',
        targetAndroidPath: 'modules/api/components/gesturehandler',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
        cleanupTargetPath: false, // first step cleans parent directory
      },
      {
        sourceAndroidPath: 'android/common/src/main/java/com/swmansion/common',
        targetAndroidPath: 'modules/api/components/gesturehandler/common',
        sourceAndroidPackage: 'com.swmansion.common',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
        cleanupTargetPath: false, // first steps cleans parent directory
      },
      {
        sourceAndroidPath: 'android/src/paper/java/com/facebook/react/viewmanagers',
        targetAndroidPath: '../../../../com/facebook/react/viewmanagers',
        sourceAndroidPackage: 'com.facebook.react.viewmanagers',
        targetAndroidPackage: 'com.facebook.react.viewmanagers',
        cleanupTargetPath: false,
      },
      {
        sourceAndroidPath: 'android/src/paper/java/com/swmansion/gesturehandler',
        targetAndroidPath: 'modules/api/components/gesturehandler',
        sourceAndroidPackage: 'com.swmansion.gesturehandler',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.gesturehandler',
        cleanupTargetPath: false,
      },
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
        onDidVendorAndroidFile: async (file: string) => {
          const fileName = path.basename(file);
          if (fileName === 'ReanimatedUIManager.java') {
            // reanimated tries to override react native `UIManager` implementation.
            // this file is placed inside `com/swmansion/reanimated/layoutReanimation/ReanimatedUIManager.java`
            // but its package name is `package com.facebook.react.uimanager;`.
            // we should put this into correct folder structure so that other files can
            // `import com.facebook.react.uimanager.ReanimatedUIManager`
            await fs.move(
              file,
              path.join(
                ANDROID_DIR,
                'expoview',
                'src',
                'main',
                'java',
                'com',
                'facebook',
                'react',
                'uimanager',
                fileName
              ),
              { overwrite: true }
            );
          }
        },
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
    moduleModifier: ScreensModifier,
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/Screens',
        sourceAndroidPath: 'android/src/main/java/com/swmansion/rnscreens',
        targetAndroidPath: 'modules/api/screens',
        sourceAndroidPackage: 'com.swmansion.rnscreens',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.screens',
        onDidVendorAndroidFile: async (file: string) => {
          const filename = path.basename(file);
          const CHANGES = {
            'ScreenStack.kt': {
              find: /(?=^class ScreenStack\()/m,
              replaceWith: `import host.exp.expoview.R\n\n`,
            },
            'ScreenStackHeaderConfig.kt': {
              find: /(?=^class ScreenStackHeaderConfig\()/m,
              replaceWith: `import host.exp.expoview.BuildConfig\nimport host.exp.expoview.R\n\n`,
            },
            'RNScreensPackage.kt': {
              find: /(?=^class RNScreensPackage\ :)/m,
              replaceWith: `import host.exp.expoview.BuildConfig\n\n`,
            },
            'Screen.kt': {
              find: /(?=^@SuppressLint\(\"ViewConstructor\"\)\nclass Screen)/m,
              replaceWith: `import host.exp.expoview.BuildConfig\n\n`,
            },
          };

          const fileConfig = CHANGES[filename];
          if (!fileConfig) {
            return;
          }

          const originalFileContent = await fs.readFile(file, 'utf8');
          const newFileContent = originalFileContent.replace(
            fileConfig.find,
            fileConfig.replaceWith
          );
          await fs.writeFile(file, newFileContent, 'utf8');
        },
      },
      {
        cleanupTargetPath: false,
        sourceAndroidPath: 'android/src/paper/java/com/swmansion/rnscreens',
        targetAndroidPath: 'modules/api/screens',
        sourceAndroidPackage: 'com.swmansion.rnscreens',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.screens',
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
      {
        sourceAndroidPath: 'android/src/oldarch/com/reactnativecommunity/webview',
        cleanupTargetPath: false,
        targetAndroidPath: 'modules/api/components/webview',
        sourceAndroidPackage: 'com.reactnativecommunity.webview',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.components.webview',
        onDidVendorAndroidFile: async (file: string) => {
          const fileName = path.basename(file);
          if (fileName === 'RNCWebViewPackage.java') {
            let content = await fs.readFile(file, 'utf8');
            content = content.replace(
              /^(package .+)$/gm,
              '$1\nimport host.exp.expoview.BuildConfig;'
            );
            await fs.writeFile(file, content, 'utf8');
          }
        },
      },
    ],
  },
  'react-native-safe-area-context': {
    repoUrl: 'https://github.com/th3rdwave/react-native-safe-area-context',
    steps: [
      {
        sourceIosPath: 'ios',
        targetIosPath: 'Api/SafeAreaContext',
        sourceAndroidPath: 'android/src/main/java/com/th3rdwave/safeareacontext',
        targetAndroidPath: 'modules/api/safeareacontext',
        sourceAndroidPackage: 'com.th3rdwave.safeareacontext',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.safeareacontext',
        onDidVendorAndroidFile: async (file: string) => {
          const fileName = path.basename(file);
          if (fileName === 'SafeAreaContextPackage.kt') {
            let content = await fs.readFile(file, 'utf8');
            content = content.replace(
              /^(package .+)$/gm,
              '$1\nimport host.exp.expoview.BuildConfig'
            );
            await fs.writeFile(file, content, 'utf8');
          }
        },
      },
      {
        sourceIosPath: 'ios/SafeAreaContextSpec',
        targetIosPath: 'Api/SafeAreaContext',
        cleanupTargetPath: false,
      },
      {
        sourceAndroidPath: 'android/src/paper/java/com/th3rdwave/safeareacontext',
        targetAndroidPath: 'modules/api/safeareacontext',
        sourceAndroidPackage: 'com.th3rdwave.safeareacontext',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.safeareacontext',
        cleanupTargetPath: false,
      },
      {
        sourceAndroidPath: 'android/src/paper/java/com/facebook/react/viewmanagers',
        targetAndroidPath: 'modules/api/safeareacontext',
        sourceAndroidPackage: 'com.facebook.react.viewmanagers',
        targetAndroidPackage: 'versioned.host.exp.exponent.modules.api.safeareacontext',
        cleanupTargetPath: false,
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
    const cleanupTargetPath = step.cleanupTargetPath ?? true;

    // iOS
    if (executeIOS && step.sourceIosPath && step.targetIosPath) {
      const sourceDir = path.join(tmpDir, step.sourceIosPath);
      const targetDir = path.join(IOS_DIR, 'Exponent', 'Versioned', 'Core', step.targetIosPath);

      if (cleanupTargetPath) {
        console.log(
          `\nCleaning up iOS files at ${chalk.magenta(path.relative(IOS_DIR, targetDir))} ...`
        );

        await fs.remove(targetDir);
      }
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

      if (cleanupTargetPath) {
        console.log(
          `\nCleaning up Android files at ${chalk.magenta(
            path.relative(ANDROID_DIR, targetDir)
          )} ...`
        );

        await fs.remove(targetDir);
      }
      await fs.mkdirs(targetDir);

      console.log('\nCopying Android files ...');

      const javaFiles = await findAndroidFilesAsync(sourceDir);

      await copyFilesAsync(javaFiles, sourceDir, targetDir);

      const files = await findAndroidFilesAsync(targetDir);

      for (const file of files) {
        await renamePackageAndroidAsync(file, step.sourceAndroidPackage, step.targetAndroidPackage);
        await step.onDidVendorAndroidFile?.(file);
      }
    }
  }
}
