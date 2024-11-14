import chalk from 'chalk';
import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import {
  createSpecFromPodspecAsync,
  generateXcodeProjectAsync,
  INFO_PLIST_FILENAME,
} from './XcodeGen';
import XcodeProject from './XcodeProject';
import { Flavor, Framework, XcodebuildSettings } from './XcodeProject.types';
import { Podspec } from '../CocoaPods';
import { EXPO_GO_IOS_DIR } from '../Constants';
import logger from '../Logger';
import { Package } from '../Packages';

const PODS_DIR = path.join(EXPO_GO_IOS_DIR, 'Pods');

// We will be increasing this list slowly. Once all are enabled,
// find a better way to ignore some packages that shouldn't be prebuilt (like interfaces).
export const PACKAGES_TO_PREBUILD = [
  // 'expo-app-auth',
  // 'expo-apple-authentication',
  // 'expo-application',
  // 'expo-av',
  // 'expo-background-fetch',
  // 'expo-battery',
  // 'expo-blur',
  // 'expo-brightness',
  // 'expo-calendar',
  // 'expo-camera',
  // 'expo-cellular',
  // 'expo-constants',
  'expo-contacts',
  // 'expo-crypto',
  // 'expo-device',
  // 'expo-document-picker',
  // 'expo-face-detector',
  'expo-file-system',
  // 'expo-firebase-analytics',
  // 'expo-firebase-core',
  // 'expo-font',
  'expo-gl',
  // 'expo-haptics',
  // 'expo-image-loader',
  // 'expo-image-manipulator',
  // 'expo-image-picker',
  // 'expo-keep-awake',
  // 'expo-linear-gradient',
  // 'expo-local-authentication',
  // 'expo-localization',
  'expo-location',
  // 'expo-mail-composer',
  'expo-media-library',
  // 'expo-network',
  'expo-notifications',
  // 'expo-permissions',
  'expo-print',
  // 'expo-screen-capture',
  // 'expo-screen-orientation',
  // 'expo-secure-store',
  'expo-sensors',
  // 'expo-sharing',
  // 'expo-sms',
  // 'expo-speech',
  'expo-splash-screen',
  // 'expo-sqlite',
  // 'expo-store-review',
  // 'expo-structured-headers',
  // 'expo-task-manager',
  // 'expo-updates',
  // 'expo-video-thumbnails',
  // 'expo-web-browser',
  // 'unimodules-app-loader',
];

export function canPrebuildPackage(pkg: Package): boolean {
  return PACKAGES_TO_PREBUILD.includes(pkg.packageName);
}

/**
 * Automatically generates `.xcodeproj` from podspec and build frameworks.
 */
export async function prebuildPackageAsync(
  pkg: Package,
  settings?: XcodebuildSettings
): Promise<void> {
  if (canPrebuildPackage(pkg)) {
    const xcodeProject = await generateXcodeProjectSpecAsync(pkg);
    await buildFrameworksForProjectAsync(xcodeProject, settings);
    await cleanTemporaryFilesAsync(xcodeProject);
  }
}

export async function buildFrameworksForProjectAsync(
  xcodeProject: XcodeProject,
  settings?: XcodebuildSettings
) {
  const flavors: Flavor[] = [
    {
      configuration: 'Release',
      sdk: 'iphoneos',
      archs: ['arm64'],
    },
    {
      configuration: 'Release',
      sdk: 'iphonesimulator',
      archs: ['x86_64', 'arm64'],
    },
  ];

  // Builds frameworks from flavors.
  const frameworks: Framework[] = [];
  for (const flavor of flavors) {
    logger.log('   Building framework for %s', chalk.yellow(flavor.sdk));

    frameworks.push(
      await xcodeProject.buildFrameworkAsync(xcodeProject.name, flavor, {
        ONLY_ACTIVE_ARCH: false,
        BITCODE_GENERATION_MODE: 'bitcode',
        BUILD_LIBRARY_FOR_DISTRIBUTION: true,
        DEAD_CODE_STRIPPING: true,
        DEPLOYMENT_POSTPROCESSING: true,
        STRIP_INSTALLED_PRODUCT: true,
        STRIP_STYLE: 'non-global',
        COPY_PHASE_STRIP: true,
        GCC_GENERATE_DEBUGGING_SYMBOLS: false,
        ...settings,
      })
    );
  }

  // Print binary sizes
  const binarySizes = frameworks.map((framework) =>
    chalk.magenta((framework.binarySize / 1024 / 1024).toFixed(2) + 'MB')
  );
  logger.log('   Binary sizes:', binarySizes.join(', '));

  logger.log('   Merging frameworks to', chalk.magenta(`${xcodeProject.name}.xcframework`));

  // Merge frameworks into universal xcframework
  await xcodeProject.buildXcframeworkAsync(frameworks, settings);
}

/**
 * Removes all temporary files that we generated in order to create `.xcframework` file.
 */
export async function cleanTemporaryFilesAsync(xcodeProject: XcodeProject) {
  logger.log('   Cleaning up temporary files');

  const pathsToRemove = [`${xcodeProject.name}.xcodeproj`, INFO_PLIST_FILENAME];

  await Promise.all(
    pathsToRemove.map((pathToRemove) => fs.remove(path.join(xcodeProject.rootDir, pathToRemove)))
  );
}

/**
 * Generates Xcode project based on the podspec of given package.
 */
export async function generateXcodeProjectSpecAsync(pkg: Package): Promise<XcodeProject> {
  const podspec = await pkg.getPodspecAsync();

  if (!podspec) {
    throw new Error('Given package is not an iOS project.');
  }

  logger.log('   Generating Xcode project spec');

  return await generateXcodeProjectSpecFromPodspecAsync(
    podspec,
    path.join(pkg.path, pkg.iosSubdirectory)
  );
}

/**
 * Generates Xcode project based on the given podspec.
 */
export async function generateXcodeProjectSpecFromPodspecAsync(
  podspec: Podspec,
  dir: string
): Promise<XcodeProject> {
  const spec = await createSpecFromPodspecAsync(podspec, async (dependencyName) => {
    const frameworkPath = await findFrameworkForProjectAsync(dependencyName);

    if (frameworkPath) {
      return {
        framework: frameworkPath,
        link: false,
        embed: false,
      };
    }
    return null;
  });

  const xcodeprojPath = await generateXcodeProjectAsync(dir, spec);
  return await XcodeProject.fromXcodeprojPathAsync(xcodeprojPath);
}

/**
 * Removes prebuilt `.xcframework` files for given packages.
 */
export async function cleanFrameworksAsync(packages: Package[]) {
  for (const pkg of packages) {
    const xcFrameworkFilename = `${pkg.podspecName}.xcframework`;
    const xcFrameworkPath = path.join(pkg.path, pkg.iosSubdirectory, xcFrameworkFilename);

    if (await fs.pathExists(xcFrameworkPath)) {
      await fs.remove(xcFrameworkPath);
    }
  }
}

/**
 * Checks whether given project name has a framework (GoogleSignIn, FBAudience) and returns its path.
 */
async function findFrameworkForProjectAsync(projectName: string): Promise<string | null> {
  const searchNames = new Set([
    projectName,
    projectName.replace(/\/+/, ''), // Firebase/MLVision -> FirebaseMLVision
    projectName.replace(/\/+.*$/, ''), // FacebookSDK/* -> FacebookSDK
  ]);

  for (const name of searchNames) {
    const cwd = path.join(PODS_DIR, name);

    if (await fs.pathExists(cwd)) {
      const paths = await glob(`**/*.framework`, {
        cwd,
      });

      if (paths.length > 0) {
        return path.join(cwd, paths[0]);
      }
    }
  }
  return null;
}
