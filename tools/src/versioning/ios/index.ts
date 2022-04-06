import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import glob from 'glob-promise';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR, IOS_DIR, VERSIONED_RN_IOS_DIR } from '../../Constants';
import logger from '../../Logger';
import { getListOfPackagesAsync, Package } from '../../Packages';
import { renderExpoKitPodspecAsync } from '../../dynamic-macros/IosMacrosGenerator';
import { runTransformPipelineAsync } from './transforms';
import { injectMacros } from './transforms/injectMacros';
import { kernelFilesTransforms } from './transforms/kernelFilesTransforms';
import { podspecTransforms } from './transforms/podspecTransforms';
import { postTransforms } from './transforms/postTransforms';
import { getVersionedDirectory, getVersionedExpoKitPath } from './utils';
import { versionExpoModulesAsync } from './versionExpoModules';
import {
  MODULES_PROVIDER_POD_NAME,
  versionExpoModulesProviderAsync,
} from './versionExpoModulesProvider';
import { runReactNativeCodegenAsync } from './versionReactNative';
import {
  versionVendoredModulesAsync,
  removeVersionedVendoredModulesAsync,
} from './versionVendoredModules';

export { versionVendoredModulesAsync, versionExpoModulesAsync };

const UNVERSIONED_PLACEHOLDER = '__UNVERSIONED__';
const RELATIVE_RN_PATH = './react-native-lab/react-native';

const EXTERNAL_REACT_ABI_DEPENDENCIES = [
  'Amplitude',
  'Analytics',
  'AppAuth',
  'FBAudienceNetwork',
  'FBSDKCoreKit',
  'GoogleSignIn',
  'GoogleMaps',
  'Google-Maps-iOS-Utils',
  'lottie-ios',
  'JKBigInteger',
  'Branch',
  'Google-Mobile-Ads-SDK',
  'RCT-Folly',
];

/**
 *  Transform and rename the given react native source code files.
 *  @param filenames list of files to transform
 *  @param versionPrefix A version-specific prefix to apply to all symbols in the code, e.g.
 *    RCTSomeClass becomes {versionPrefix}RCTSomeClass
 *  @param versionedPodNames mapping from unversioned cocoapods names to versioned cocoapods names,
 *    e.g. React -> ReactABI99_0_0
 */
async function namespaceReactNativeFilesAsync(filenames, versionPrefix, versionedPodNames) {
  const reactPodName = versionedPodNames.React;
  const transformRules = _getReactNativeTransformRules(versionPrefix, reactPodName);
  const taskQueue = new TaskQueue(Promise as PromisyClass, 4); // Transform up to 4 files simultaneously.
  const transformRulesCache = {};

  const transformSingleFile = taskQueue.wrap(async (filename) => {
    if (_isDirectory(filename)) {
      return;
    }
    // protect contents of EX_UNVERSIONED macro
    let unversionedCaptures: string[] = [];
    await _transformFileContentsAsync(filename, (fileString) => {
      let pattern = /EX_UNVERSIONED\((.*?)\)/g;
      let match = pattern.exec(fileString);
      while (match != null) {
        unversionedCaptures.push(match[1]);
        match = pattern.exec(fileString);
      }
      if (unversionedCaptures.length) {
        return fileString.replace(pattern, UNVERSIONED_PLACEHOLDER);
      }
      return null;
    });

    // rename file
    const dirname = path.dirname(filename);
    const basename = path.basename(filename);
    const targetPath = path.join(dirname, `${versionPrefix}${basename}`);

    // filter transformRules to patterns which apply to this dirname
    const filteredTransformRules =
      transformRulesCache[dirname] || _getTransformRulesForDirname(transformRules, dirname);
    transformRulesCache[dirname] = transformRules;

    // Perform sed find & replace.
    for (const rule of filteredTransformRules) {
      await spawnAsync('sed', [rule.flags || '-i', '--', rule.pattern, filename]);
    }

    // Rename file to be prefixed.
    await fs.move(filename, targetPath);

    // perform transforms that sed can't express
    await _transformFileContentsAsync(targetPath, async (fileString) => {
      // rename misc imports, e.g. Layout.h
      fileString = fileString.replace(
        /#(include|import)\s+"((?:[^"\/]+\/)?)([^"]+\.h)"/g,
        (match, p1, p2, p3) => {
          return p3.startsWith(versionPrefix) ? match : `#${p1} "${p2}${versionPrefix}${p3}"`;
        }
      );

      // restore EX_UNVERSIONED contents
      if (unversionedCaptures) {
        let index = 0;
        do {
          fileString = fileString.replace(UNVERSIONED_PLACEHOLDER, unversionedCaptures[index]);
          index++;
        } while (fileString.indexOf(UNVERSIONED_PLACEHOLDER) !== -1);
      }

      const injectedMacrosOutput = await runTransformPipelineAsync({
        pipeline: injectMacros(versionPrefix),
        input: fileString,
        targetPath,
      });

      return await runTransformPipelineAsync({
        pipeline: postTransforms(versionPrefix),
        input: injectedMacrosOutput,
        targetPath,
      });
    });
    // process `filename`
  });

  await Promise.all(filenames.map(transformSingleFile));
}

/**
 *  Transform and rename all code files we care about under `rnPath`
 */
async function transformReactNativeAsync(rnPath, versionName, versionedPodNames) {
  let filenameQueries = [`${rnPath}/**/*.[hmSc]`, `${rnPath}/**/*.mm`, `${rnPath}/**/*.cpp`];
  let filenames: string[] = [];
  await Promise.all(
    filenameQueries.map(async (query) => {
      let queryFilenames = (await glob(query)) as string[];
      if (queryFilenames) {
        filenames = filenames.concat(queryFilenames);
      }
    })
  );

  return namespaceReactNativeFilesAsync(filenames, versionName, versionedPodNames);
}

/**
 * For all files matching the given glob query, namespace and rename them
 * with the given version number. This utility is mainly useful for backporting
 * small changes into an existing SDK. To create a new SDK version, use `addVersionAsync`
 * instead.
 * @param globQuery a string to pass to glob which matches some file paths
 * @param versionNumber Exponent SDK version, e.g. 42.0.0
 */
export async function versionReactNativeIOSFilesAsync(globQuery, versionNumber) {
  let filenames = await glob(globQuery);
  if (!filenames || !filenames.length) {
    throw new Error(`No files matched the given pattern: ${globQuery}`);
  }
  let { versionName, versionedPodNames } = await getConfigsFromArguments(versionNumber);
  console.log(`Versioning ${filenames.length} files with SDK version ${versionNumber}...`);
  return namespaceReactNativeFilesAsync(filenames, versionName, versionedPodNames);
}

async function generateVersionedReactNativeAsync(versionName: string): Promise<void> {
  const versionedReactNativePath = getVersionedReactNativePath(versionName);

  await fs.mkdirs(versionedReactNativePath);

  // Clone react native latest version
  console.log(`Copying files from ${chalk.magenta(RELATIVE_RN_PATH)} ...`);

  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'React'),
    path.join(versionedReactNativePath, 'React')
  );
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'Libraries'),
    path.join(versionedReactNativePath, 'Libraries')
  );
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'React.podspec'),
    path.join(versionedReactNativePath, 'React.podspec')
  );
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'React-Core.podspec'),
    path.join(versionedReactNativePath, 'React-Core.podspec')
  );
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'ReactCommon', 'ReactCommon.podspec'),
    path.join(versionedReactNativePath, 'ReactCommon', 'ReactCommon.podspec')
  );
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'ReactCommon', 'React-Fabric.podspec'),
    path.join(versionedReactNativePath, 'ReactCommon', 'React-Fabric.podspec')
  );
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'package.json'),
    path.join(versionedReactNativePath, 'package.json')
  );

  console.log(`Removing unnecessary ${chalk.magenta('*.js')} files ...`);

  const jsFiles = (await glob(path.join(versionedReactNativePath, '**', '*.js'))) as string[];

  for (const jsFile of jsFiles) {
    await fs.remove(jsFile);
  }
  await Promise.all(jsFiles.map((jsFile) => fs.remove(jsFile)));

  console.log('Running react-native-codegen');
  await runReactNativeCodegenAsync(path.join(EXPO_DIR, RELATIVE_RN_PATH), versionedReactNativePath, versionName);

  console.log(
    `Copying cpp libraries from ${chalk.magenta(path.join(RELATIVE_RN_PATH, 'ReactCommon'))} ...`
  );
  const cppLibraries = getCppLibrariesToVersion();

  await fs.mkdirs(path.join(versionedReactNativePath, 'ReactCommon'));

  for (const library of cppLibraries) {
    await fs.copy(
      path.join(EXPO_DIR, RELATIVE_RN_PATH, 'ReactCommon', library.libName),
      path.join(versionedReactNativePath, 'ReactCommon', library.libName)
    );
  }

  await generateReactNativePodScriptAsync(versionedReactNativePath, versionName);
  await generateReactNativePodspecsAsync(versionedReactNativePath, versionName);
}

/**
 * There are some kernel files that unfortunately have to call versioned code directly.
 * This function applies the specified changes in the kernel codebase.
 * The nature of kernel modifications is that they are temporary and at one point these have to be rollbacked.
 * @param versionName SDK version, e.g. 21.0.0, 37.0.0, etc.
 * @param rollback flag indicating whether to invoke rollbacking modification.
 */
async function modifyKernelFilesAsync(
  versionName: string,
  rollback: boolean = false
): Promise<void> {
  const kernelFilesPath = path.join(IOS_DIR, 'Exponent/kernel');
  const filenameQueries = [`${kernelFilesPath}/**/EXAppViewController.m`];
  let filenames: string[] = [];
  await Promise.all(
    filenameQueries.map(async (query) => {
      let queryFilenames = (await glob(query)) as string[];
      if (queryFilenames) {
        filenames = filenames.concat(queryFilenames);
      }
    })
  );
  await Promise.all(
    filenames.map(async (filename) => {
      console.log(`Modifying ${chalk.magenta(path.relative(EXPO_DIR, filename))}:`);
      await _transformFileContentsAsync(filename, (fileContents) =>
        runTransformPipelineAsync({
          pipeline: kernelFilesTransforms(versionName, rollback),
          targetPath: filename,
          input: fileContents,
        })
      );
    })
  );
}
/**
 * - Copies `scripts/react_native_pods.rb` script into versioned ReactNative directory.
 * - Removes pods installed from third-party-podspecs (we don't version them).
 * - Versions `use_react_native` method and all pods it declares.
 */
async function generateReactNativePodScriptAsync(
  versionedReactNativePath: string,
  versionName: string
): Promise<void> {
  await fs.copy(
    path.join(EXPO_DIR, RELATIVE_RN_PATH, 'scripts'),
    path.join(versionedReactNativePath, 'scripts'),
  );

  const targetAutolinkPath = path.join(versionedReactNativePath, 'scripts', 'react_native_pods.rb');
  let targetSource = (await fs.readFile(targetAutolinkPath, 'utf8'))
    .replace('def use_react_native!', `def use_react_native_${versionName}!`)
    .replace('def use_react_native_codegen!', `def use_react_native_codegen_${versionName}!`)
    .replace(/(\bpod\s+([^\n]+)\/third-party-podspecs\/([^\n]+))/g, '# $1')
    .replace(/\bpod\s+'([^\']+)'/g, `pod '${versionName}$1'`)
    .replace(/(:path => "[^"]+")/g, `$1, :project_name => '${versionName}'`)
    // Removes duplicated constants
    .replace("DEFAULT_OTHER_CPLUSPLUSFLAGS = '$(inherited)'", '')
    .replace("NEW_ARCH_OTHER_CPLUSPLUSFLAGS = '$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'", '')
    ;

  // Since `React-Codegen.podspec` is generated during `pod install`, versioning should be done in the pod script.
  const reactCodegenDependencies = [
    'FBReactNativeSpec',
    'React-jsiexecutor',
    'RCTRequired',
    'RCTTypeSafety',
    'React-Core',
    'React-jsi',
    'ReactCommon/turbomodule/core',
    'React-graphics',
    'React-rncore',
  ];
  const reactCodegenDependenciesRegExp = new RegExp(`["'](${reactCodegenDependencies.join('|')})["']:(\\s*\\[version\\],?)`, 'g');
  targetSource = targetSource
    .replace("$CODEGEN_OUTPUT_DIR = 'build/generated/ios'", `$CODEGEN_OUTPUT_DIR = 'build/${versionName}/generated/ios'`)
    .replace(/\$(CODEGEN_OUTPUT_DIR)\b/g, `$${versionName}$1`)
    .replace(/\b(React-Codegen)\b/g, `${versionName}$1`)
    .replace(/(\$\(PODS_ROOT\)\/Headers\/Private\/)React-/g, `$1${versionName}React-`)
    .replace(reactCodegenDependenciesRegExp, `"${versionName}$1":$2`)
    ;

  await fs.writeFile(targetAutolinkPath, targetSource);
}

async function generateReactNativePodspecsAsync(
  versionedReactNativePath: string,
  versionName: string
): Promise<void> {
  const podspecFiles = await glob(path.join(versionedReactNativePath, '**', '*.podspec'));

  for (const podspecFile of podspecFiles) {
    const basename = path.basename(podspecFile, '.podspec');

    if (/^react$/i.test(basename)) {
      continue;
    }

    console.log(
      `Generating podspec for ${chalk.green(basename)} at ${chalk.magenta(
        path.relative(versionedReactNativePath, podspecFile)
      )} ...`
    );

    const podspecSource = await fs.readFile(podspecFile, 'utf8');

    const podspecOutput = await runTransformPipelineAsync({
      pipeline: podspecTransforms(versionName),
      input: podspecSource,
      targetPath: podspecFile,
    });

    // Write transformed podspec output to the prefixed file.
    await fs.writeFile(
      path.join(path.dirname(podspecFile), `${versionName}${basename}.podspec`),
      podspecOutput
    );

    // Remove original and unprefixed podspec.
    await fs.remove(podspecFile);
  }

  await generateReactPodspecAsync(versionedReactNativePath, versionName);
}

/**
 * @param versionName Version prefix (e.g. `ABI43_0_0`)
 * @param sdkNumber Major version of the SDK
 */
async function generateVersionedExpoAsync(versionName: string, sdkNumber: number): Promise<void> {
  const versionedExpoKitPath = getVersionedExpoKitPath(versionName);
  const versionedUnimodulePods = await getVersionedUnimodulePodsAsync(versionName);

  await fs.mkdirs(versionedExpoKitPath);

  // Copy versioned exponent modules into the clone
  console.log(`Copying versioned native modules into the new Pod...`);

  await fs.copy(path.join(IOS_DIR, 'Exponent', 'Versioned'), versionedExpoKitPath);

  await fs.copy(
    path.join(EXPO_DIR, 'ios', 'ExpoKit.podspec'),
    path.join(versionedExpoKitPath, 'ExpoKit.podspec')
  );

  console.log(`Generating podspec for ${chalk.green('ExpoKit')} ...`);

  await generateExpoKitPodspecAsync(
    versionedExpoKitPath,
    versionedUnimodulePods,
    versionName,
    `${sdkNumber}.0.0`
  );

  logger.info('🦅 Generating Swift modules provider');

  await versionExpoModulesProviderAsync(sdkNumber);
}

/**
 * Transforms ExpoKit.podspec, versioning Expo namespace, React pod name, replacing original ExpoKit podspecs
 * with Expo and ExpoOptional.
 * @param specfilePath location of ExpoKit.podspec to modify, e.g. /versioned-react-native/someversion/
 * @param versionedReactPodName name of the new pod (and podfile)
 * @param universalModulesPodNames versioned names of universal modules
 * @param versionNumber "XX.X.X"
 */
async function generateExpoKitPodspecAsync(
  specfilePath: string,
  universalModulesPodNames: { [key: string]: string },
  versionName: string,
  versionNumber: string
): Promise<void> {
  const versionedReactPodName = getVersionedReactPodName(versionName);
  const versionedExpoKitPodName = getVersionedExpoKitPodName(versionName);
  const specFilename = path.join(specfilePath, 'ExpoKit.podspec');

  // rename spec to newPodName
  const sedPattern = `s/\\(s\\.name[[:space:]]*=[[:space:]]\\)"ExpoKit"/\\1"${versionedExpoKitPodName}"/g`;

  await spawnAsync('sed', ['-i', '--', sedPattern, specFilename]);

  // further processing that sed can't do very well
  await _transformFileContentsAsync(specFilename, async (fileString) => {
    // `universalModulesPodNames` contains only versioned unimodules,
    // so we fall back to the original name if the module is not there
    const universalModulesDependencies = (await getListOfPackagesAsync())
      .filter((pkg) => pkg.isIncludedInExpoClientOnPlatform('ios') && pkg.podspecName)
      .map(
        ({ podspecName }) =>
          `ss.dependency         "${universalModulesPodNames[podspecName!] || podspecName}"`
      ).join(`
    `);
    const externalDependencies = EXTERNAL_REACT_ABI_DEPENDENCIES.map(
      (podName) => `ss.dependency         "${podName}"`
    ).join(`
    `);
    let subspec = `s.subspec "Expo" do |ss|
    ss.source_files     = "Core/**/*.{h,m,mm,cpp}"

    ss.dependency         "${versionedReactPodName}-Core"
    ss.dependency         "${versionedReactPodName}-Core/DevSupport"
    ss.dependency         "${versionedReactPodName}Common"
    ${universalModulesDependencies}
    ${externalDependencies}
    ss.dependency         "${versionName}${MODULES_PROVIDER_POD_NAME}"
  end

  s.subspec "ExpoOptional" do |ss|
    ss.dependency         "${versionedExpoKitPodName}/Expo"
    ss.source_files     = "Optional/**/*.{h,m,mm}"
  end`;
    fileString = fileString.replace(
      /(s\.subspec ".+?"[\S\s]+?(?=end\b)end\b[\s]+)+/g,
      `${subspec}\n`
    );

    // correct version number
    fileString = fileString.replace(/(?<=s.version = ").*?(?=")/g, versionNumber);

    // add Reanimated V2 RCT-Folly dependency
    fileString = fileString
      .replace(
        /(?=Pod::Spec.new do \|s\|)/,
        `
folly_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
folly_compiler_flags = folly_flags + ' ' + '-Wno-comma -Wno-shorten-64-to-32'
boost_compiler_flags = '-Wno-documentation'\n\n`
      )
      .replace(
        /(?=  s.subspec "Expo" do \|ss\|)/g,
        `
  s.pod_target_xcconfig    = {
    "USE_HEADERMAP"       => "YES",
    "HEADER_SEARCH_PATHS" => "\\"$(PODS_TARGET_SRCROOT)/ReactCommon\\" \\"$(PODS_TARGET_SRCROOT)\\" \\"$(PODS_ROOT)/RCT-Folly\\" \\"$(PODS_ROOT)/boost\\" \\"$(PODS_ROOT)/DoubleConversion\\" \\"$(PODS_ROOT)/Headers/Private/React-Core\\" "
  }
  s.compiler_flags = folly_compiler_flags + ' ' + boost_compiler_flags
  s.xcconfig               = {
    "HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\" \\"$(PODS_ROOT)/glog\\" \\"$(PODS_ROOT)/RCT-Folly\\" \\"$(PODS_ROOT)/Headers/Private/${versionName}React-Core\\"",
    "OTHER_CFLAGS"        => "$(inherited)" + " " + folly_flags
  }\n\n`
      );

    return fileString;
  });

  // move podspec to ${versionedExpoKitPodName}.podspec
  await fs.move(specFilename, path.join(specfilePath, `${versionedExpoKitPodName}.podspec`));
}

/**
 *  @param specfilePath location of React.podspec to modify, e.g. /versioned-react-native/someversion/
 *  @param versionedReactPodName name of the new pod (and podfile)
 */
async function generateReactPodspecAsync(versionedReactNativePath, versionName) {
  const versionedReactPodName = getVersionedReactPodName(versionName);
  const versionedYogaPodName = getVersionedYogaPodName(versionName);
  const versionedJSIPodName = getVersionedJSIPodName(versionName);
  const specFilename = path.join(versionedReactNativePath, 'React.podspec');

  // rename spec to newPodName
  const sedPattern = `s/\\(s\\.name[[:space:]]*=[[:space:]]\\)"React"/\\1"${versionedReactPodName}"/g`;
  await spawnAsync('sed', ['-i', '--', sedPattern, specFilename]);

  // rename header_dir
  await spawnAsync('sed', [
    '-i',
    '--',
    `s/^\\(.*header_dir.*\\)React\\(.*\\)$/\\1${versionedReactPodName}\\2/`,
    specFilename,
  ]);
  await spawnAsync('sed', [
    '-i',
    '--',
    `s/^\\(.*header_dir.*\\)jsireact\\(.*\\)$/\\1${versionedJSIPodName}\\2/`,
    specFilename,
  ]);

  // point source at .
  const newPodSource = `{ :path => "." }`;
  await spawnAsync('sed', [
    '-i',
    '--',
    `s/\\(s\\.source[[:space:]]*=[[:space:]]\\).*/\\1${newPodSource}/g`,
    specFilename,
  ]);

  // further processing that sed can't do very well
  await _transformFileContentsAsync(specFilename, (fileString) => {
    // replace React/* dependency with ${versionedReactPodName}/*
    fileString = fileString.replace(
      /(\.dependency\s+)"React([^"]+)"/g,
      `$1"${versionedReactPodName}$2"`
    );

    fileString = fileString.replace('/RCTTV', `/${versionName}RCTTV`);

    // namespace cpp libraries
    const cppLibraries = getCppLibrariesToVersion();
    cppLibraries.forEach(({ libName }) => {
      fileString = fileString.replace(
        new RegExp(`([^A-Za-z0-9_])${libName}([^A-Za-z0-9_])`, 'g'),
        `$1${getVersionedLibraryName(libName, versionName)}$2`
      );
    });

    // fix wrong Yoga pod name
    fileString = fileString.replace(
      /^(.*dependency.*["']).*yoga.*?(["'].*)$/m,
      `$1${versionedYogaPodName}$2`
    );

    return fileString;
  });

  // move podspec to ${versionedReactPodName}.podspec
  await fs.move(
    specFilename,
    path.join(versionedReactNativePath, `${versionedReactPodName}.podspec`)
  );
}

function getCFlagsToPrefixGlobals(prefix, globals) {
  return globals.map((val) => `-D${val}=${prefix}${val}`);
}

/**
 * Generates `dependencies.rb` and `postinstalls.rb` files for versioned code.
 * @param versionNumber Semver-compliant version of the SDK/ABI
 * @param versionName Version prefix used for versioned files, e.g. ABI99_0_0
 * @param versionedPodNames mapping from pod names to versioned pod names, e.g. React -> ReactABI99_0_0
 * @param versionedReactPodPath path of the new react pod
 */
async function generatePodfileSubscriptsAsync(
  versionNumber: string,
  versionName: string,
  versionedPodNames: Record<string, string>,
  versionedReactPodPath: string
) {
  if (!versionedPodNames.React) {
    throw new Error(
      'Tried to add generate pod dependencies, but missing a name for the versioned library.'
    );
  }

  const relativeReactNativePath = path.relative(IOS_DIR, getVersionedReactNativePath(versionName));
  const relativeExpoKitPath = path.relative(IOS_DIR, getVersionedExpoKitPath(versionName));

  // Add a dependency on newPodName
  const dependenciesContent = `# @generated by expotools

require './${relativeReactNativePath}/scripts/react_native_pods.rb'

use_react_native_${versionName}! path: './${relativeReactNativePath}'

pod '${getVersionedExpoKitPodName(versionName)}',
  :path => './${relativeExpoKitPath}',
  :project_name => '${versionName}',
  :subspecs => ['Expo', 'ExpoOptional']

use_pods! '{versioned,vendored}/sdk${semver.major(
    versionNumber
  )}/**/*.podspec.json', '${versionName}'
`;

  await fs.writeFile(path.join(versionedReactPodPath, 'dependencies.rb'), dependenciesContent);

  // Add postinstall.
  // In particular, resolve conflicting globals from React by redefining them.
  let globals = {
    React: [
      // RCTNavigator
      'kNeverRequested',
      'kNeverProgressed',
      // react-native-maps
      'kSMCalloutViewRepositionDelayForUIScrollView',
      'regionAsJSON',
      'unionRect',
      // jschelpers
      'JSNoBytecodeFileFormatVersion',
      'JSSamplingProfilerEnabled',
      // RCTInspectorPackagerConnection
      'RECONNECT_DELAY_MS',
      // RCTSpringAnimation
      'MAX_DELTA_TIME',
    ],
    yoga: [
      'gCurrentGenerationCount',
      'gPrintSkips',
      'gPrintChanges',
      'layoutNodeInternal',
      'gDepth',
      'gPrintTree',
      'isUndefined',
      'gNodeInstanceCount',
    ],
  };
  let configValues = getCFlagsToPrefixGlobals(
    versionedPodNames.React,
    globals.React.concat(globals.yoga)
  );
  const indent = '  '.repeat(3);
  const config = `# @generated by expotools

if pod_name.start_with?('${versionedPodNames.React}') || pod_name == '${versionedPodNames.ExpoKit}'
  target_installation_result.native_target.build_configurations.each do |config|
    config.build_settings['OTHER_CFLAGS'] = %w[
      ${configValues.join(`\n${indent}`)}
    ]
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << '${versionName}RCT_DEV=1'
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << '${versionName}RCT_ENABLE_INSPECTOR=0'
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << '${versionName}ENABLE_PACKAGER_CONNECTION=0'
    # Enable Google Maps support
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << '${versionName}HAVE_GOOGLE_MAPS=1'
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << '${versionName}HAVE_GOOGLE_MAPS_UTILS=1'
  end
end
`;
  await fs.writeFile(path.join(versionedReactPodPath, 'postinstalls.rb'), config);
}

/**
 * @param transformConfig function that takes a config dict and returns a new config dict.
 */
async function modifyVersionConfigAsync(configPath, transformConfig) {
  let jsConfigFilename = `${configPath}/sdkVersions.json`;
  await _transformFileContentsAsync(jsConfigFilename, (jsConfigContents) => {
    let jsConfig;

    // read the existing json config and add the new version to the sdkVersions array
    try {
      jsConfig = JSON.parse(jsConfigContents);
    } catch (e) {
      console.log('Error parsing existing sdkVersions.json file, writing a new one...', e);
      console.log('The erroneous file contents was:', jsConfigContents);
      jsConfig = {
        sdkVersions: [],
      };
    }
    // apply changes
    jsConfig = transformConfig(jsConfig);
    return JSON.stringify(jsConfig);
  });

  // convert json config to plist for iOS
  await spawnAsync('plutil', [
    '-convert',
    'xml1',
    jsConfigFilename,
    '-o',
    path.join(configPath, 'EXSDKVersions.plist'),
  ]);
}

function validateAddVersionDirectories(rootPath, newVersionPath) {
  // Make sure the paths we want to read are available
  let relativePathsToCheck = [
    RELATIVE_RN_PATH,
    'ios/versioned-react-native',
    'ios/Exponent',
    'ios/Exponent/Versioned',
  ];
  let isValid = true;
  relativePathsToCheck.forEach((path) => {
    try {
      fs.accessSync(`${rootPath}/${path}`, fs.constants.F_OK);
    } catch (e) {
      console.log(`${rootPath}/${path} does not exist or is otherwise inaccessible`);
      isValid = false;
    }
  });
  // Also, make sure the version we're about to write doesn't already exist
  try {
    // we want this to fail
    fs.accessSync(newVersionPath, fs.constants.F_OK);
    console.log(`${newVersionPath} already exists, will not overwrite`);
    isValid = false;
  } catch (e) {}

  return isValid;
}

function validateRemoveVersionDirectories(rootPath, newVersionPath) {
  let pathsToCheck = [
    `${rootPath}/ios/versioned-react-native`,
    `${rootPath}/ios/Exponent`,
    newVersionPath,
  ];
  let isValid = true;
  pathsToCheck.forEach((path) => {
    try {
      fs.accessSync(path, fs.constants.F_OK);
    } catch (e) {
      console.log(`${path} does not exist or is otherwise inaccessible`);
      isValid = false;
    }
  });
  return isValid;
}

async function getConfigsFromArguments(versionNumber) {
  let versionComponents = versionNumber.split('.');
  versionComponents = versionComponents.map((number) => parseInt(number, 10));
  let versionName = 'ABI' + versionNumber.replace(/\./g, '_');
  let rootPathComponents = EXPO_DIR.split('/');
  let versionPathComponents = path.join('ios', 'versioned-react-native', versionName).split('/');
  let newVersionPath = rootPathComponents.concat(versionPathComponents).join('/');

  let versionedPodNames = {
    React: getVersionedReactPodName(versionName),
    yoga: getVersionedYogaPodName(versionName),
    ExpoKit: getVersionedExpoKitPodName(versionName),
    jsireact: getVersionedJSIPodName(versionName),
  };

  return {
    sdkNumber: semver.major(versionNumber),
    versionName,
    newVersionPath,
    versionedPodNames,
    versionComponents,
  };
}

async function getVersionedUnimodulePodsAsync(
  versionName: string
): Promise<{ [key: string]: string }> {
  const versionedUnimodulePods = {};
  const packages = await getListOfPackagesAsync();

  packages.forEach((pkg) => {
    const podName = pkg.podspecName;
    if (podName && pkg.isVersionableOnPlatform('ios')) {
      versionedUnimodulePods[podName] = `${versionName}${podName}`;
    }
  });

  return versionedUnimodulePods;
}

function getVersionedReactPodName(versionName: string): string {
  return getVersionedLibraryName('React', versionName);
}

function getVersionedYogaPodName(versionName: string): string {
  return getVersionedLibraryName('Yoga', versionName);
}

function getVersionedJSIPodName(versionName: string): string {
  return getVersionedLibraryName('jsiReact', versionName);
}

function getVersionedExpoKitPodName(versionName: string): string {
  return getVersionedLibraryName('ExpoKit', versionName);
}

function getVersionedLibraryName(libraryName: string, versionName: string): string {
  return `${versionName}${libraryName}`;
}

function getVersionedReactNativePath(versionName: string): string {
  return path.join(VERSIONED_RN_IOS_DIR, versionName, 'ReactNative');
}

function getVersionedExpoPath(versionName: string): string {
  return path.join(VERSIONED_RN_IOS_DIR, versionName, 'Expo');
}

function getCppLibrariesToVersion() {
  return [
    {
      libName: 'cxxreact',
    },
    {
      libName: 'jsi',
    },
    {
      libName: 'jsiexecutor',
      customHeaderDir: 'jsireact',
    },
    {
      libName: 'jsinspector',
    },
    {
      libName: 'yoga',
    },
    {
      libName: 'react',
    },
    {
      libName: 'callinvoker',
      customHeaderDir: 'ReactCommon',
    },
    {
      libName: 'reactperflogger',
    },
    {
      libName: 'runtimeexecutor',
    },
    {
      libName: 'logger',
    },
  ];
}

export async function addVersionAsync(versionNumber: string, packages: Package[]) {
  const { sdkNumber, versionName, newVersionPath, versionedPodNames } =
    await getConfigsFromArguments(versionNumber);

  // Validate the directories we need before doing anything
  console.log(`Validating root directory ${chalk.magenta(EXPO_DIR)} ...`);
  let isFilesystemReady = validateAddVersionDirectories(EXPO_DIR, newVersionPath);
  if (!isFilesystemReady) {
    throw new Error('Aborting: At least one directory we need is not available');
  }

  if (!versionedPodNames.React) {
    throw new Error('Missing name for versioned pod dependency.');
  }

  // Create ABIXX_0_0 directory.
  console.log(
    `Creating new ABI version ${chalk.cyan(versionNumber)} at ${chalk.magenta(
      path.relative(EXPO_DIR, newVersionPath)
    )}`
  );
  await fs.mkdirs(newVersionPath);

  // Generate new Podspec from the existing React.podspec
  console.log('Generating versioned ReactNative directory...');
  await generateVersionedReactNativeAsync(versionName);

  console.log(
    `Generating ${chalk.magenta(
      path.relative(EXPO_DIR, getVersionedExpoPath(versionName))
    )} directory...`
  );
  await generateVersionedExpoAsync(versionName, sdkNumber);

  await versionExpoModulesAsync(sdkNumber, packages);

  // Generate versioned Swift modules provider
  await versionExpoModulesProviderAsync(sdkNumber);

  // Namespace the new React clone
  console.log('Namespacing/transforming files...');
  await transformReactNativeAsync(newVersionPath, versionName, versionedPodNames);
  await transformReactNativeAsync(path.join(IOS_DIR, 'build', versionName, 'generated', 'ios'), versionName, versionedPodNames);

  // Generate Ruby scripts with versioned dependencies and postinstall actions that will be evaluated in the Expo client's Podfile.
  console.log('Adding dependency to root Podfile...');
  await generatePodfileSubscriptsAsync(
    versionNumber,
    versionName,
    versionedPodNames,
    newVersionPath
  );

  // Add the new version to the iOS config list of available versions
  console.log('Registering new version under sdkVersions config...');
  const addVersionToConfig = (config, versionNumber) => {
    config.sdkVersions.push(versionNumber);
    return config;
  };
  await modifyVersionConfigAsync(path.join(IOS_DIR, 'Exponent', 'Supporting'), (config) =>
    addVersionToConfig(config, versionNumber)
  );
  await modifyVersionConfigAsync(
    path.join(EXPO_DIR, 'exponent-view-template', 'ios', 'exponent-view-template', 'Supporting'),
    (config) => addVersionToConfig(config, versionNumber)
  );

  // Modifying kernel files
  console.log(`Modifying ${chalk.bold('kernel files')} to incorporate new SDK version...`);
  await modifyKernelFilesAsync(versionName);

  console.log('Removing any `filename--` files from the new pod ...');

  try {
    const minusMinusFiles = [
      ...await glob(path.join(newVersionPath, '**', '*--')),
      ...await glob(path.join(IOS_DIR, 'build', versionName, 'generated', 'ios', '**', '*--')),
    ];
    for (const minusMinusFile of minusMinusFiles) {
      await fs.remove(minusMinusFile);
    }
  } catch (error) {
    console.warn(
      "The script wasn't able to remove any possible `filename--` files created by sed. Please ensure there are no such files manually."
    );
  }

  console.log('Finished creating new version.');
}

async function askToReinstallPodsAsync(): Promise<boolean> {
  if (process.env.CI) {
    // If we're on the CI, let's regenerate Pods by default.
    return true;
  }
  const { result } = await inquirer.prompt<{ result: boolean }>([
    {
      type: 'confirm',
      name: 'result',
      message: 'Do you want to reinstall pods?',
      default: true,
    },
  ]);
  return result;
}

export async function reinstallPodsAsync(force?: boolean, preventReinstall?: boolean) {
  if (
    preventReinstall !== true &&
    (force || (force !== false && (await askToReinstallPodsAsync())))
  ) {
    await spawnAsync('pod', ['install'], { stdio: 'inherit', cwd: IOS_DIR });
    console.log(
      'Regenerated Podfile and installed new pods. You can now try to build the project in Xcode.'
    );
  } else {
    console.log(
      'Skipped pods regeneration. You might want to run `et ios-generate-dynamic-macros`, then `pod install` in `ios` to configure Xcode project.'
    );
  }
}

export async function removeVersionAsync(versionNumber: string) {
  const { sdkNumber, newVersionPath, versionedPodNames, versionName } =
    await getConfigsFromArguments(versionNumber);

  console.log(
    `Removing SDK version ${chalk.cyan(versionNumber)} from ${chalk.magenta(
      path.relative(EXPO_DIR, newVersionPath)
    )} with Pod name ${chalk.green(versionedPodNames.React)}`
  );

  // Validate the directories we need before doing anything
  console.log(`Validating root directory ${chalk.magenta(EXPO_DIR)} ...`);
  let isFilesystemReady = validateRemoveVersionDirectories(EXPO_DIR, newVersionPath);
  if (!isFilesystemReady) {
    console.log('Aborting: At least one directory we expect is not available');
    return;
  }

  // remove directory
  console.log(
    `Removing versioned files under ${chalk.magenta(path.relative(EXPO_DIR, newVersionPath))}...`
  );
  await fs.remove(newVersionPath);
  await fs.remove(getVersionedDirectory(sdkNumber));

  console.log('Removing vendored libraries...');
  await removeVersionedVendoredModulesAsync(semver.major(versionNumber));

  // remove dep from main podfile
  console.log(`Removing ${chalk.green(versionedPodNames.React)} dependency from root Podfile...`);

  // remove from sdkVersions.json
  console.log('Unregistering version from sdkVersions config...');
  const removeVersionFromConfig = (config, versionNumber) => {
    let index = config.sdkVersions.indexOf(versionNumber);
    if (index > -1) {
      // modify in place
      config.sdkVersions.splice(index, 1);
    }
    return config;
  };
  await modifyVersionConfigAsync(path.join(IOS_DIR, 'Exponent', 'Supporting'), (config) =>
    removeVersionFromConfig(config, versionNumber)
  );
  await modifyVersionConfigAsync(
    path.join(EXPO_DIR, 'exponent-view-template', 'ios', 'exponent-view-template', 'Supporting'),
    (config) => removeVersionFromConfig(config, versionNumber)
  );

  // modify kernel files
  console.log('Rollbacking SDK modifications from kernel files...');
  await modifyKernelFilesAsync(versionName, true);

  // Update `ios/ExpoKit.podspec` with the newest SDK version
  logger.info('🎨 Updating ExpoKit podspec');
  await renderExpoKitPodspecAsync(EXPO_DIR, path.join(EXPO_DIR, 'template-files'));

  await reinstallPodsAsync();
}

/**
 *  @return an array of objects representing react native transform rules.
 *    objects must contain 'pattern' and may optionally contain 'paths' to limit
 *    the transform to certain file paths.
 *
 *  the rules are applied in order!
 */
function _getReactNativeTransformRules(versionPrefix, reactPodName) {
  const cppLibraries = getCppLibrariesToVersion().map((lib) => lib.customHeaderDir || lib.libName);
  const versionedLibs = [...cppLibraries, 'React', 'FBLazyVector', 'FBReactNativeSpec'];

  return [
    {
      // Change Obj-C symbols prefix
      pattern: `s/RCT/${versionPrefix}RCT/g`,
    },
    {
      pattern: `s/^EX/${versionPrefix}EX/g`,
      // paths: 'EX',
    },
    {
      pattern: `s/^UM/${versionPrefix}UM/g`,
      // paths: 'EX',
    },
    {
      pattern: `s/\\([^\\<\\/"]\\)YG/\\1${versionPrefix}YG/g`,
    },
    {
      pattern: `s/\\([\\<,]\\)YG/\\1${versionPrefix}YG/g`,
    },
    {
      pattern: `s/^YG/${versionPrefix}YG/g`,
    },
    {
      paths: 'Components',
      pattern: `s/\\([^+]\\)AIR/\\1${versionPrefix}AIR/g`,
    },
    {
      pattern: `s/\\([^A-Za-z0-9_]\\)EX/\\1${versionPrefix}EX/g`,
    },
    {
      pattern: `s/\\([^A-Za-z0-9_]\\)UM/\\1${versionPrefix}UM/g`,
    },
    {
      pattern: `s/\\([^A-Za-z0-9_+]\\)ART/\\1${versionPrefix}ART/g`,
    },
    {
      pattern: `s/ENABLE_PACKAGER_CONNECTION/${versionPrefix}ENABLE_PACKAGER_CONNECTION/g`,
    },
    {
      paths: 'Components',
      pattern: `s/\\([^A-Za-z0-9_+]\\)SM/\\1${versionPrefix}SM/g`,
    },
    {
      paths: 'Core/Api',
      pattern: `s/\\([^A-Za-z0-9_+]\\)RN/\\1${versionPrefix}RN/g`,
    },
    {
      paths: 'Core/Api',
      pattern: `s/^RN/${versionPrefix}RN/g`,
    },
    {
      paths: 'Core/Api',
      pattern: `s/HAVE_GOOGLE_MAPS/${versionPrefix}HAVE_GOOGLE_MAPS/g`,
    },
    {
      paths: 'Core/Api',
      pattern: `s/#import "Branch/#import "${versionPrefix}Branch/g`,
    },
    {
      paths: 'Core/Api',
      pattern: `s/#import "NSObject+RNBranch/#import "${versionPrefix}NSObject+RNBranch/g`,
    },
    {
      // React will be prefixed in a moment
      pattern: `s/#import <${versionPrefix}RCTAnimation/#import <React/g`,
    },
    {
      paths: 'Core/Api/Reanimated',
      pattern: `s/\\([^A-Za-z0-9_+]\\)REA/\\1${versionPrefix}REA/g`,
    },
    {
      pattern: `s/^REA/${versionPrefix}REA/g`,
      paths: 'Core/Api/Reanimated',
    },
    {
      // Prefixes all direct references to objects under `reanimated` namespace.
      // It must be applied before versioning `namespace reanimated` so
      // `using namespace reanimated::` don't get versioned twice.
      pattern: `s/reanimated::/${versionPrefix}reanimated::/g`,
    },
    {
      // Prefixes reanimated namespace.
      pattern: `s/namespace reanimated/namespace ${versionPrefix}reanimated/g`,
    },
    {
      // Fix imports in C++ libs in ReactCommon.
      // Extended syntax (-E) is required to use (a|b).
      flags: '-Ei',
      pattern: `s/([<"])(${versionedLibs.join(
        '|'
      )})\\//\\1${versionPrefix}\\2\\/${versionPrefix}/g`,
    },
    {
      // Change React -> new pod name
      // e.g. threads and queues namespaced to com.facebook.react,
      // file paths beginning with the lib name,
      // the cpp facebook::react namespace,
      // iOS categories ending in +React
      flags: '-Ei',
      pattern: `s/[Rr]eact/${reactPodName}/g`,
    },
    {
      // Imports from cxxreact and jsireact got prefixed twice.
      flags: '-Ei',
      pattern: `s/([<"])(${versionPrefix})(cxx|jsi)${versionPrefix}React/\\1\\2\\3react/g`,
    },
    {
      // Fix imports from files like `UIView+React.*`.
      flags: '-Ei',
      pattern: `s/\\+${versionPrefix}React/\\+React/g`,
    },
    {
      // Prefixes all direct references to objects under `facebook` namespace.
      // It must be applied before versioning `namespace facebook` so
      // `using namespace facebook::` don't get versioned twice.
      pattern: `s/facebook::/${versionPrefix}facebook::/g`,
    },
    {
      // Prefixes facebook namespace.
      pattern: `s/namespace facebook/namespace ${versionPrefix}facebook/g`,
    },
    {
      // For UMReactNativeAdapter
      // Fix names with 'React' substring occurring twice - only first one should be prefixed
      flags: '-Ei',
      pattern: `s/${versionPrefix}UM([[:alpha:]]*)${reactPodName}/${versionPrefix}UM\\1React/g`,
    },
    {
      // For EXReactNativeAdapter
      pattern: `s/${versionPrefix}EX${reactPodName}/${versionPrefix}EXReact/g`,
    },
    {
      // For EXConstants and EXNotifications so that when their migrators
      // try to access legacy storage for UUID migration, they access the proper value.
      pattern: `s/${versionPrefix}EXDeviceInstallUUIDKey/EXDeviceInstallUUIDKey/g`,
      paths: 'Expo',
    },
    {
      // For EXConstants and EXNotifications so that the installation ID
      // stays the same between different SDK versions. (https://github.com/expo/expo/issues/11008#issuecomment-726370187)
      pattern: `s/${versionPrefix}EXDeviceInstallationUUIDKey/EXDeviceInstallationUUIDKey/g`,
      paths: 'Expo',
    },
    {
      // RCTPlatform exports version of React Native
      pattern: `s/${reactPodName}NativeVersion/reactNativeVersion/g`,
    },
    {
      pattern: `s/@"${versionPrefix}RCT"/@"RCT"/g`,
    },
    {
      // Unversion EXGL_CPP imports: `<ABI37_0_0EXGL_CPP/` => `<EXGL_CPP/`
      pattern: `s/<${versionPrefix}EXGL_CPP\\//<EXGL_CPP\\//g`,
    },
    {
      // Unprefix everything that got prefixed twice or more times.
      flags: '-Ei',
      pattern: `s/(${versionPrefix}){2,}/\\1/g`,
    },
    {
      flags: '-Ei',
      pattern: `s/(#import |__has_include\\()<(Expo|RNReanimated)/\\1<${versionPrefix}\\2/g`,
    },
  ];
}

function _getTransformRulesForDirname(transformRules, dirname) {
  return transformRules.filter((rule) => {
    return (
      // no paths specified, so apply rule to everything
      !rule.paths ||
      // otherwise, limit this rule to paths specified
      dirname.indexOf(rule.paths) !== -1
    );
  });
}

// TODO: use the one in XDL
function _isDirectory(dir) {
  try {
    if (fs.statSync(dir).isDirectory()) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

// TODO: use the one in XDL
async function _transformFileContentsAsync(
  filename: string,
  transform: (fileString: string) => Promise<string> | string | null
) {
  let fileString = await fs.readFile(filename, 'utf8');
  let newFileString = await transform(fileString);
  if (newFileString !== null) {
    await fs.writeFile(filename, newFileString);
  }
}
