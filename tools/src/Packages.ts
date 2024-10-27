import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { Podspec, readPodspecAsync } from './CocoaPods';
import * as Directories from './Directories';
import * as Npm from './Npm';

const ANDROID_DIR = Directories.getExpoGoAndroidDir();
const IOS_DIR = Directories.getExpoGoIosDir();
const PACKAGES_DIR = Directories.getPackagesDir();

/**
 * Cached list of packages or `null` if they haven't been loaded yet. See `getListOfPackagesAsync`.
 */
let cachedPackages: Package[] | null = null;

export interface CodegenConfigLibrary {
  name: string;
  type: 'modules' | 'components';
  jsSrcsDir: string;
}

export enum DependencyKind {
  Normal = 'dependencies',
  Dev = 'devDependencies',
  Peer = 'peerDependencies',
  Optional = 'optionalDependencies',
}

export const DefaultDependencyKind = [DependencyKind.Normal, DependencyKind.Dev];

/**
 * An object representing `package.json` structure.
 */
export type PackageJson = {
  name: string;
  version: string;
  scripts: Record<string, string>;
  gitHead?: string;
  codegenConfig?: {
    libraries: CodegenConfigLibrary[];
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
};

/**
 * Type of package's dependency returned by `getDependencies`.
 */
export type PackageDependency = {
  name: string;
  kind: DependencyKind;
  versionRange: string;
};

/**
 * Union with possible platform names.
 */
type Platform = 'ios' | 'android' | 'web';

/**
 * Type representing `expo-modules.config.json` structure.
 */
export type ExpoModuleConfig = {
  name: string;
  platforms: Platform[];
  ios?: {
    subdirectory?: string;
    podName?: string;
    podspecPath?: string;
  };
  android?: {
    subdirectory?: string;
  };
};

/**
 * Represents a package in the monorepo.
 */
export class Package {
  path: string;
  packageJson: PackageJson;
  expoModuleConfig: ExpoModuleConfig;
  packageView?: Npm.PackageViewType | null;

  constructor(rootPath: string, packageJson?: PackageJson) {
    this.path = rootPath;
    this.packageJson = packageJson || require(path.join(rootPath, 'package.json'));
    this.expoModuleConfig = readExpoModuleConfigJson(rootPath);
  }

  get hasPlugin(): boolean {
    return fs.pathExistsSync(path.join(this.path, 'plugin'));
  }

  get hasCli(): boolean {
    return fs.pathExistsSync(path.join(this.path, 'cli'));
  }

  get hasUtils(): boolean {
    return fs.pathExistsSync(path.join(this.path, 'utils'));
  }

  get hasReactServerComponents(): boolean {
    return 'test:rsc' in this.packageJson.scripts;
  }

  get packageName(): string {
    return this.packageJson.name;
  }

  get packageVersion(): string {
    return this.packageJson.version;
  }

  get packageSlug(): string {
    return (this.expoModuleConfig && this.expoModuleConfig.name) || this.packageName;
  }

  get scripts(): { [key: string]: string } {
    return this.packageJson.scripts || {};
  }

  get podspecPath(): string | null {
    if (this.expoModuleConfig?.ios?.podspecPath) {
      return this.expoModuleConfig.ios.podspecPath;
    }

    // Obtain podspecName by looking for podspecs in both package's root directory and ios subdirectory.
    const [podspecPath] = glob.sync(`{*,${this.iosSubdirectory}/*}.podspec`, {
      cwd: this.path,
    });

    return podspecPath || null;
  }

  get podspecName(): string | null {
    const iosConfig = {
      subdirectory: 'ios',
      ...(this.expoModuleConfig?.ios ?? {}),
    };

    // 'ios.podName' is actually not used anywhere in our modules, but let's have the same logic as react-native-unimodules script.
    if ('podName' in iosConfig) {
      return iosConfig.podName as string;
    }

    const podspecPath = this.podspecPath;
    if (!podspecPath) {
      return null;
    }
    return path.basename(podspecPath, '.podspec');
  }

  get iosSubdirectory(): string {
    return this.expoModuleConfig?.ios?.subdirectory ?? 'ios';
  }

  get androidSubdirectory(): string {
    return this.expoModuleConfig?.android?.subdirectory ?? 'android';
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

  get androidPackageNamespace(): string | null {
    if (!this.isSupportedOnPlatform('android')) {
      return null;
    }
    const buildGradle = fs.readFileSync(
      path.join(this.path, this.androidSubdirectory, 'build.gradle'),
      'utf8'
    );
    const match = buildGradle.match(/^\s+namespace\s*=?\s*['"]([\w.]+)['"]/m);
    return match?.[1] ?? null;
  }

  get changelogPath(): string {
    return path.join(this.path, 'CHANGELOG.md');
  }

  isExpoModule() {
    return !!this.expoModuleConfig;
  }

  containsPodspecFile() {
    return [
      ...fs.readdirSync(this.path),
      ...fs.readdirSync(path.join(this.path, this.iosSubdirectory)),
    ].some((path) => path.endsWith('.podspec'));
  }

  isSupportedOnPlatform(platform: 'ios' | 'android'): boolean {
    if (this.expoModuleConfig && !fs.existsSync(path.join(this.path, 'react-native.config.js'))) {
      // check platform support from expo autolinking but not rn-cli linking which is not platform aware
      return this.expoModuleConfig.platforms?.includes(platform) ?? false;
    } else if (platform === 'android') {
      return fs.existsSync(path.join(this.path, this.androidSubdirectory, 'build.gradle'));
    } else if (platform === 'ios') {
      return (
        fs.existsSync(path.join(this.path, this.iosSubdirectory)) && this.containsPodspecFile()
      );
    }
    return false;
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
      // On Android we need to read settings.gradle file
      const settingsGradle = fs.readFileSync(path.join(ANDROID_DIR, 'settings.gradle'), 'utf8');
      const match = settingsGradle.search(
        new RegExp(
          `useExpoModules\\([^\\)]+exclude\\s*:\\s*\\[[^\\]]*'${this.packageName}'[^\\]]*\\][^\\)]+\\)`
        )
      );
      // this is somewhat brittle so we do a quick-and-dirty sanity check:
      // 'expo-in-app-purchases' should never be included so if we don't find a match
      // for that package, something is wrong.
      if (this.packageName === 'expo-in-app-purchases' && match === -1) {
        throw new Error(
          "'isIncludedInExpoClientOnPlatform' is not behaving correctly, please check android/settings.gradle format"
        );
      }
      return match === -1;
    }
    throw new Error(
      `'isIncludedInExpoClientOnPlatform' is not supported on '${platform}' platform yet.`
    );
  }

  async getPackageViewAsync(): Promise<Npm.PackageViewType | null> {
    if (this.packageView !== undefined) {
      return this.packageView;
    }
    return await Npm.getPackageViewAsync(this.packageName, this.packageVersion);
  }

  getDependencies(kinds: DependencyKind[] = [DependencyKind.Normal]): PackageDependency[] {
    const dependencies = kinds.map((kind) => {
      const deps = this.packageJson[kind];

      return !deps
        ? []
        : Object.entries(deps).map(([name, versionRange]) => {
            return {
              name,
              kind,
              versionRange,
            };
          });
    });
    return ([] as PackageDependency[]).concat(...dependencies);
  }

  dependsOn(packageName: string): boolean {
    return this.getDependencies().some((dep) => dep.name === packageName);
  }

  /**
   * Iterates through dist tags returned by npm to determine an array of tags to which given version is bound.
   */
  async getDistTagsAsync(version: string = this.packageVersion): Promise<string[]> {
    const pkgView = await this.getPackageViewAsync();
    const distTags = pkgView?.['dist-tags'] ?? {};
    return Object.keys(distTags).filter((tag) => distTags[tag] === version);
  }

  /**
   * Checks whether the package depends on a local pod with given name.
   */
  async hasLocalPodDependencyAsync(podName?: string | null): Promise<boolean> {
    if (!podName) {
      return false;
    }
    const podspecPath = path.join(this.path, 'ios/Pods/Local Podspecs', `${podName}.podspec.json`);
    return await fs.pathExists(podspecPath);
  }

  /**
   * Checks whether package has its own changelog file.
   */
  async hasChangelogAsync(): Promise<boolean> {
    return fs.pathExists(this.changelogPath);
  }

  /**
   * Checks whether the package contains native unit tests on the given platform.
   */
  async hasNativeTestsAsync(platform: Platform): Promise<boolean> {
    if (platform === 'android') {
      return (
        fs.pathExists(path.join(this.path, this.androidSubdirectory, 'src/test')) ||
        fs.pathExists(path.join(this.path, this.androidSubdirectory, 'src/androidTest'))
      );
    }
    if (platform === 'ios') {
      return (
        this.isSupportedOnPlatform(platform) &&
        !!this.podspecPath &&
        fs.readFileSync(path.join(this.path, this.podspecPath), 'utf8').includes('test_spec')
      );
    }
    // TODO(tsapeta): Support web.
    throw new Error(`"hasNativeTestsAsync" for platform "${platform}" is not implemented yet.`);
  }

  /**
   * Checks whether package contains native instrumentation tests for Android.
   */
  async hasNativeInstrumentationTestsAsync(platform: Platform): Promise<boolean> {
    if (platform === 'android') {
      return fs.pathExists(path.join(this.path, this.androidSubdirectory, 'src/androidTest'));
    }
    return false;
  }

  /**
   * Reads the podspec and returns it in JSON format
   * or `null` if the package doesn't have a podspec.
   */
  async getPodspecAsync(): Promise<Podspec | null> {
    if (!this.podspecPath) {
      return null;
    }
    const podspecPath = path.join(this.path, this.podspecPath);
    return await readPodspecAsync(podspecPath);
  }
}

/**
 * Resolves to a Package instance if the package with given name exists in the repository.
 */
export function getPackageByName(packageName: string): Package | null {
  const packageJsonPath = pathToLocalPackageJson(packageName);
  try {
    const packageJson = require(packageJsonPath);
    return new Package(path.dirname(packageJsonPath), packageJson);
  } catch {
    return null;
  }
}

/**
 * Resolves to an array of Package instances that represent Expo packages inside given directory.
 */
export async function getListOfPackagesAsync(): Promise<Package[]> {
  if (!cachedPackages) {
    const paths = await glob('**/package.json', {
      cwd: PACKAGES_DIR,
      ignore: [
        '**/example/**',
        '**/node_modules/**',
        '**/static/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
      ],
    });
    cachedPackages = paths
      .map((packageJsonPath) => {
        const fullPackageJsonPath = path.join(PACKAGES_DIR, packageJsonPath);
        const packagePath = path.dirname(fullPackageJsonPath);
        const packageJson = require(fullPackageJsonPath);

        return new Package(packagePath, packageJson);
      })
      .filter((pkg) => !!pkg.packageName);
  }
  return cachedPackages;
}

function readExpoModuleConfigJson(dir: string) {
  const expoModuleConfigJsonPath = path.join(dir, 'expo-module.config.json');
  const expoModuleConfigJsonExists = fs.existsSync(expoModuleConfigJsonPath);
  const unimoduleJsonPath = path.join(dir, 'unimodule.json');
  try {
    return require(expoModuleConfigJsonExists ? expoModuleConfigJsonPath : unimoduleJsonPath);
  } catch {
    return null;
  }
}

function pathToLocalPackageJson(packageName: string): string {
  return path.join(PACKAGES_DIR, packageName, 'package.json');
}
