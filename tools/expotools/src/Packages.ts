import path from 'path';
import fs from 'fs-extra';
import glob from 'glob-promise';

import IosUnversionablePackages from './versioning/ios/unversionablePackages.json';
import AndroidUnversionablePackages from './versioning/android/unversionablePackages.json';
import * as Directories from './Directories';
import * as Npm from './Npm';

const ANDROID_DIR = Directories.getAndroidDir();
const IOS_DIR = Directories.getIosDir();
const PACKAGES_DIR = Directories.getPackagesDir();

/**
 * Cached list of packages or `null` if they haven't been loaded yet. See `getListOfPackagesAsync`.
 */
let cachedPackages: Package[] | null = null;

/**
 * An object representing `package.json` structure.
 */
export type PackageJson = {
  name: string;
  version: string;
  scripts: { [key: string]: string };
  gitHead?: string;
  [key: string]: any;
};

/**
 * Type of package's dependency returned by `getDependencies`.
 */
export type PackageDependency = {
  name: string;
  group: string;
  versionRange: string;
};

/**
 * Represents a package in the monorepo.
 */
export class Package {
  path: string;
  packageJson: PackageJson;
  unimoduleJson: any;
  packageView?: Npm.PackageViewType | null;

  constructor(rootPath: string, packageJson?: PackageJson) {
    this.path = rootPath;
    this.packageJson = packageJson || require(path.join(rootPath, 'package.json'));
    this.unimoduleJson = readUnimoduleJsonAtDirectory(rootPath);
  }

  get packageName(): string {
    return this.packageJson.name;
  }

  get packageVersion(): string {
    return this.packageJson.version;
  }

  get packageSlug(): string {
    return (this.unimoduleJson && this.unimoduleJson.name) || this.packageName;
  }

  get scripts(): { [key: string]: string } {
    return this.packageJson.scripts || {};
  }

  get podspecName(): string | null {
    if (!this.unimoduleJson) {
      return null;
    }

    const iosConfig = {
      subdirectory: 'ios',
      ...('ios' in this.unimoduleJson ? this.unimoduleJson.ios : {}),
    };

    // 'ios.podName' is actually not used anywhere in our unimodules, but let's have the same logic as react-native-unimodules script.
    if ('podName' in iosConfig) {
      return iosConfig.podName as string;
    }

    // Obtain podspecName by looking for podspecs
    const podspecPaths = glob.sync('**/*.podspec', {
      cwd: path.join(this.path, iosConfig.subdirectory),
    });

    if (!podspecPaths || podspecPaths.length === 0) {
      return null;
    }
    return path.basename(podspecPaths[0], '.podspec');
  }

  get androidSubdirectory(): string {
    return this.unimoduleJson?.android?.subdirectory ?? 'android';
  }

  get androidPackageName(): string | null {
    if (!this.isSupportedOnPlatform('android')) {
      return null;
    }
    const buildGradle = fs.readFileSync(
      path.join(this.path, this.androidSubdirectory, 'build.gradle'),
      'utf8'
    );
    const match = buildGradle.match(/^group ?= ?'([\w.]+)'\n/m);
    return match?.[1] ?? null;
  }

  get changelogPath(): string {
    return path.join(this.path, 'CHANGELOG.md');
  }

  isUnimodule() {
    return !!this.unimoduleJson;
  }

  isSupportedOnPlatform(platform: 'ios' | 'android'): boolean {
    return this.unimoduleJson?.platforms?.includes(platform) ?? false;
  }

  isIncludedInExpoClientOnPlatform(platform: 'ios' | 'android'): boolean {
    if (platform === 'ios') {
      // On iOS we can easily check whether the package is included in Expo client by checking if it is installed by Cocoapods.
      const { podspecName } = this;
      return (
        podspecName != null &&
        fs.pathExistsSync(path.join(IOS_DIR, 'Pods', 'Headers', 'Public', podspecName))
      );
    } else if (platform === 'android') {
      // On Android we need to read expoview's build.gradle file
      const buildGradle = fs.readFileSync(path.join(ANDROID_DIR, 'expoview/build.gradle'), 'utf8');
      const match = buildGradle.search(
        new RegExp(
          `addUnimodulesDependencies\\([^\\)]+configuration\\s*:\\s*'api'[^\\)]+exclude\\s*:\\s*\\[[^\\]]*'${this.packageName}'[^\\]]*\\][^\\)]+\\)`
        )
      );
      // this is somewhat brittle so we do a quick-and-dirty sanity check:
      // 'expo-in-app-purchases' should never be included so if we don't find a match
      // for that package, something is wrong.
      if (this.packageName === 'expo-in-app-purchases' && match === -1) {
        throw new Error(
          "'isIncludedInExpoClientOnPlatform' is not behaving correctly, please check expoview/build.gradle format"
        );
      }
      return match === -1;
    }
    throw new Error(
      `'isIncludedInExpoClientOnPlatform' is not supported on '${platform}' platform yet.`
    );
  }

  isVersionableOnPlatform(platform: 'ios' | 'android'): boolean {
    if (platform === 'ios') {
      return this.podspecName != null && !IosUnversionablePackages.includes(this.packageName);
    } else if (platform === 'android') {
      return !AndroidUnversionablePackages.includes(this.packageName);
    }
    throw new Error(`'isVersionableOnPlatform' is not supported on '${platform}' platform yet.`);
  }

  async getPackageViewAsync(): Promise<Npm.PackageViewType | null> {
    if (this.packageView !== undefined) {
      return this.packageView;
    }
    return await Npm.getPackageViewAsync(this.packageName, this.packageVersion);
  }

  getDependencies(includeAll: boolean = false): PackageDependency[] {
    const depsGroups = includeAll
      ? ['dependencies', 'devDependencies', 'peerDependencies', 'unimodulePeerDependencies']
      : ['dependencies'];

    const dependencies = depsGroups.map((group) => {
      const deps = this.packageJson[group];

      return !deps
        ? []
        : Object.entries(deps).map(([name, versionRange]) => {
            return {
              name,
              group,
              versionRange: versionRange as string,
            };
          });
    });
    return ([] as PackageDependency[]).concat(...dependencies);
  }

  dependsOn(packageName: string): boolean {
    return this.getDependencies().some((dep) => dep.name === packageName);
  }

  /**
   * Iterates through dist tags returned by npm to determine the tag to which given version is bound.
   */
  async getDistTagAsync(version: string = this.packageVersion): Promise<string | null> {
    const pkgView = await this.getPackageViewAsync();

    if (pkgView) {
      for (const tag in pkgView.distTags) {
        if (pkgView.distTags[tag] === version) {
          return tag;
        }
      }
    }
    return null;
  }

  async hasLocalPodDependencyAsync(podName?: string | null): Promise<boolean> {
    if (!podName) {
      return false;
    }
    const podspecPath = path.join(this.path, 'ios/Local Podspecs', `${podName}.podspec.json`);
    return await fs.pathExists(podspecPath);
  }
}

/**
 * Resolves to an array of Package instances that represent Expo packages inside given directory.
 */
export async function getListOfPackagesAsync(): Promise<Package[]> {
  if (!cachedPackages) {
    const paths = await glob('**/package.json', {
      cwd: PACKAGES_DIR,
      ignore: ['**/example/**', '**/node_modules/**'],
    });
    cachedPackages = paths.map((packageJsonPath) => {
      const fullPackageJsonPath = path.join(PACKAGES_DIR, packageJsonPath);
      const packagePath = path.dirname(fullPackageJsonPath);
      const packageJson = require(fullPackageJsonPath);

      return new Package(packagePath, packageJson);
    });
  }
  return cachedPackages;
}

function readUnimoduleJsonAtDirectory(dir: string) {
  const unimoduleJsonPath = path.join(dir, 'unimodule.json');
  try {
    return require(unimoduleJsonPath);
  } catch (error) {
    return null;
  }
}
