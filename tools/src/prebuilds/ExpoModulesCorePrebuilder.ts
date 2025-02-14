import assert from 'assert';
import fs from 'fs-extra';
import glob from 'glob-promise';
import path from 'path';

import * as XcodeGen from './XcodeGen';
import { ProjectSpec } from './XcodeGen.types';
import XcodeProject, {
  flavorToFrameworkPath,
  spreadArgs,
  SHARED_DERIVED_DATA_DIR,
} from './XcodeProject';
import { Flavor, Framework, XcodebuildSettings } from './XcodeProject.types';
import { podInstallAsync, Podspec } from '../CocoaPods';
import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import { transformFilesAsync } from '../Transforms';

// Generates working files out from expo-modules-core folder and prevents CocoaPods generates unnecessary files inside expo-modules-core folder
const OUT_OF_TREE_WORKING_DIR = path.join(EXPO_DIR, 'prebuild-ExpoModulesCore');
const MODULEMAP_FILE = 'ExpoModulesCore.modulemap';
const UMBRELLA_HEADER = 'ExpoModulesCore-umbrella.h';

export function isExpoModulesCore(podspec: Podspec) {
  return podspec.name === 'ExpoModulesCore';
}

export async function generateXcodeProjectAsync(dir: string, spec: ProjectSpec): Promise<string> {
  const workingDir = OUT_OF_TREE_WORKING_DIR;
  await fs.ensureDir(workingDir);
  logger.log(`   Prebuilding expo-modules-core from ${workingDir}`);

  // Links to expo-modules-core source
  if (typeof spec.targets?.['ExpoModulesCore'].sources?.[0].path === 'string') {
    spec.targets['ExpoModulesCore'].sources[0].path = path.join(
      EXPO_DIR,
      'packages',
      'expo-modules-core'
    );
  }
  // Links to generated header from prebuilder script
  spec.targets?.['ExpoModulesCore']?.sources?.push({
    path: '',
    createIntermediateGroups: true,
    name: 'ExpoModulesCore-umbrella',
    includes: ['**/*.h'],
  });

  // Override header search paths from base to target
  if (
    spec.settings?.base['HEADER_SEARCH_PATHS'] &&
    spec.targets?.['ExpoModulesCore'].settings?.base
  ) {
    spec.targets['ExpoModulesCore'].settings.base['HEADER_SEARCH_PATHS'] =
      spec.settings.base['HEADER_SEARCH_PATHS'];
  }

  if (spec.settings?.base) {
    spec.settings.base['MODULEMAP_FILE'] = MODULEMAP_FILE;
    spec.settings.base['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES';
  }

  await createModulemapAsync(workingDir);
  await createGeneratedHeaderAsync(workingDir);

  const result = await XcodeGen.generateXcodeProjectAsync(workingDir, spec);

  logger.log('   Installing Pods');
  await createPodfileAsync(workingDir);
  await podInstallAsync(workingDir);

  return result;
}

export async function buildFrameworkAsync(
  xcodeProject: XcodeProject,
  target: string,
  flavor: Flavor,
  options?: XcodebuildSettings
): Promise<Framework> {
  await xcodeProject.xcodebuildAsync(
    [
      'build',
      '-workspace',
      `${xcodeProject.name}.xcworkspace`,
      '-scheme',
      `${target}_iOS`,
      '-configuration',
      flavor.configuration,
      '-sdk',
      flavor.sdk,
      ...spreadArgs('-arch', flavor.archs),
      '-derivedDataPath',
      SHARED_DERIVED_DATA_DIR,
    ],
    options
  );

  const frameworkPath = flavorToFrameworkPath(target, flavor);
  const stat = await fs.lstat(path.join(frameworkPath, target));

  // `_CodeSignature` is apparently generated only for simulator, afaik we don't need it.
  await fs.remove(path.join(frameworkPath, '_CodeSignature'));

  return {
    target,
    flavor,
    frameworkPath,
    binarySize: stat.size,
  };
}

export async function cleanTemporaryFilesAsync(xcodeProject: XcodeProject) {
  // Moves created xcframework to package folder
  const xcFrameworkFilename = 'ExpoModulesCore.xcframework';
  await fs.move(
    path.join(OUT_OF_TREE_WORKING_DIR, xcFrameworkFilename),
    path.join(EXPO_DIR, 'packages', 'expo-modules-core', 'ios', xcFrameworkFilename)
  );

  // Cleanups working directory
  await fs.remove(OUT_OF_TREE_WORKING_DIR);
}

async function createPodfileAsync(workDir: string) {
  const content = `\
require 'pathname'
react_native_dir = File.dirname(\`node --print "require.resolve('react-native/package.json')"\`)
relative_react_native_dir = Pathname.new(react_native_dir).relative_path_from(Pathname.pwd).to_s
require File.join(react_native_dir, "scripts/react_native_pods")
require File.join(File.dirname(\`node --print "require.resolve('expo/package.json')"\`), "scripts/autolinking")

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'ExpoModulesCore_iOS' do
  use_react_native!(
    :path => relative_react_native_dir,
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/..",
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      relative_react_native_dir,
      :mac_catalyst_enabled => false,
    )
  end
end`;

  await fs.writeFile(path.join(workDir, 'Podfile'), content);
}

async function createModulemapAsync(workDir: string) {
  const content = `\
framework module ExpoModulesCore {
  umbrella header "ExpoModulesCore.h"

  export *
  module * { export * }
}`;
  await fs.writeFile(path.join(workDir, MODULEMAP_FILE), content);
}

async function createGeneratedHeaderAsync(workDir: string) {
  const srcUmbrellaHeader = path.join(
    EXPO_DIR,
    'apps',
    'bare-expo',
    'ios',
    'Pods',
    'Target Support Files',
    'ExpoModulesCore',
    UMBRELLA_HEADER
  );
  assert(
    await fs.pathExists(srcUmbrellaHeader),
    `Cannot find ${UMBRELLA_HEADER}. Make sure to run \`et pods -f\` before prebuilding.`
  );

  let content = await fs.readFile(srcUmbrellaHeader, 'utf-8');
  content = content.replace(/^#import "ExpoModulesCore\//gm, '#import "');

  await fs.writeFile(path.join(workDir, UMBRELLA_HEADER), content);
}

export async function postActionsAsync(xcframeworkOutputPath: string) {
  const swiftInterfaceFiles = await glob('**/*.swiftinterface', {
    cwd: xcframeworkOutputPath,
    absolute: true,
  });

  await transformFilesAsync(swiftInterfaceFiles, [
    {
      find: /^(\/\/ swift-module-flags: .+)$/gm,
      replaceWith:
        '$1 -Xcc -fmodule-map-file="$(PROJECT_DIR)/Pods/Headers/Public/React-Core/React/React-Core.modulemap"',
    },
  ]);
}
