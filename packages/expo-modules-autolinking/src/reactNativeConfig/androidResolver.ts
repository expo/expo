import fs from 'fs/promises';
import path from 'path';

import type {
  RNConfigDependencyAndroid,
  RNConfigReactNativePlatformsConfigAndroid,
} from './reactNativeConfig.types';
import type { ExpoModuleConfig } from '../ExpoModuleConfig';
import { scanFilesRecursively, fileExistsAsync } from '../utils';

export async function resolveDependencyConfigImplAndroidAsync(
  packageRoot: string,
  reactNativeConfig: RNConfigReactNativePlatformsConfigAndroid | null | undefined,
  expoModuleConfig?: ExpoModuleConfig | null
): Promise<RNConfigDependencyAndroid | null> {
  if (reactNativeConfig === null) {
    // Skip autolinking for this package.
    return null;
  }

  // NOTE(@kitten): We allow `reactNativeConfig === undefined` here. That indicates a missing config file
  // However, React Native modules with left out config files are explicitly supported and valid

  const sourceDir = reactNativeConfig?.sourceDir || 'android';
  const androidDir = path.join(packageRoot, sourceDir);
  const { gradle, manifest } = await findGradleAndManifestAsync({ androidDir, isLibrary: true });

  const isPureCxxDependency =
    reactNativeConfig?.cxxModuleCMakeListsModuleName != null &&
    reactNativeConfig?.cxxModuleCMakeListsPath != null &&
    reactNativeConfig?.cxxModuleHeaderName != null &&
    !manifest &&
    !gradle;

  if (!manifest && !gradle && !isPureCxxDependency) {
    return null;
  }

  if (reactNativeConfig === undefined && expoModuleConfig?.supportsPlatform('android')) {
    if (!!gradle && !expoModuleConfig?.rawConfig.android?.gradlePath) {
      // If the React Native module has a gradle file and the Expo module doesn't redirect it,
      // they will conflict and we can't link both at the same time
      return null;
    }
  }

  let packageInstance: string | null = null;
  let packageImportPath: string | null = null;
  if (!isPureCxxDependency) {
    const packageName =
      reactNativeConfig?.packageName || (await parsePackageNameAsync(manifest, gradle));
    if (!packageName) {
      return null;
    }
    const nativePackageClassName = await parseNativePackageClassNameAsync(packageRoot, androidDir);
    if (!nativePackageClassName) {
      return null;
    }
    packageImportPath =
      reactNativeConfig?.packageImportPath || `import ${packageName}.${nativePackageClassName};`;
    packageInstance = reactNativeConfig?.packageInstance || `new ${nativePackageClassName}()`;
  }

  const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  const buildTypes = reactNativeConfig?.buildTypes || [];
  const dependencyConfiguration = reactNativeConfig?.dependencyConfiguration;
  const libraryName =
    reactNativeConfig?.libraryName || (await parseLibraryNameAsync(androidDir, packageJson));
  const componentDescriptors =
    reactNativeConfig?.componentDescriptors ||
    (await parseComponentDescriptorsAsync(packageRoot, packageJson));
  let cmakeListsPath = reactNativeConfig?.cmakeListsPath
    ? path.join(androidDir, reactNativeConfig?.cmakeListsPath)
    : path.join(androidDir, 'build/generated/source/codegen/jni/CMakeLists.txt');
  const cxxModuleCMakeListsModuleName = reactNativeConfig?.cxxModuleCMakeListsModuleName || null;
  const cxxModuleHeaderName = reactNativeConfig?.cxxModuleHeaderName || null;
  let cxxModuleCMakeListsPath = reactNativeConfig?.cxxModuleCMakeListsPath
    ? path.join(androidDir, reactNativeConfig?.cxxModuleCMakeListsPath)
    : null;
  if (process.platform === 'win32') {
    cmakeListsPath = cmakeListsPath.replace(/\\/g, '/');
    if (cxxModuleCMakeListsPath) {
      cxxModuleCMakeListsPath = cxxModuleCMakeListsPath.replace(/\\/g, '/');
    }
  }

  const result: RNConfigDependencyAndroid = {
    sourceDir: androidDir,
    packageImportPath,
    packageInstance,
    dependencyConfiguration,
    buildTypes,
    libraryName,
    componentDescriptors,
    cmakeListsPath,
    cxxModuleCMakeListsModuleName,
    cxxModuleCMakeListsPath,
    cxxModuleHeaderName,
    isPureCxxDependency,
  };
  if (!result.libraryName) {
    delete result.libraryName;
  }
  if (!result.dependencyConfiguration) {
    delete result.dependencyConfiguration;
  }
  return result;
}

/**
 * Parse the `RNConfigDependencyAndroid.packageName`
 */
export async function parsePackageNameAsync(
  manifestPath: string | null,
  gradlePath: string | null
): Promise<string | null> {
  if (gradlePath) {
    const gradleContents = await fs.readFile(gradlePath, 'utf8');
    const match = gradleContents.match(/namespace\s*[=]*\s*["'](.+?)["']/);
    if (match) {
      return match[1];
    }
  }
  if (manifestPath) {
    const manifestContents = await fs.readFile(manifestPath, 'utf8');
    const match = manifestContents.match(/package="(.+?)"/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Parse the Java or Kotlin class name to for `ReactPackage` or `(Base|Turbo)ReactPackage`.
 */
export async function parseNativePackageClassNameAsync(
  packageRoot: string,
  androidDir: string
): Promise<string | null> {
  // Search for **/*Package.{java,kt} files first
  for await (const entry of scanFilesRecursively(androidDir, undefined, true)) {
    if (entry.name.endsWith('Package.java') || entry.name.endsWith('Package.kt')) {
      try {
        const contents = await fs.readFile(entry.path);
        const matched = matchNativePackageClassName(entry.path, contents);
        if (matched) {
          return matched;
        }
      } catch {
        continue;
      }
    }
  }

  // Early return if the module is an Expo module
  if (await fileExistsAsync(path.join(packageRoot, 'expo-module.config.json'))) {
    return null;
  }

  // Search all **/*.{java,kt} files
  for await (const entry of scanFilesRecursively(androidDir, undefined, true)) {
    if (entry.name.endsWith('.java') || entry.name.endsWith('.kt')) {
      const contents = await fs.readFile(entry.path);
      const matched = matchNativePackageClassName(entry.path, contents);
      if (matched) {
        return matched;
      }
    }
  }
  return null;
}

let lazyReactPackageRegex: RegExp | null = null;
let lazyTurboReactPackageRegex: RegExp | null = null;
export function matchNativePackageClassName(_filePath: string, contents: Buffer): string | null {
  const fileContents = contents.toString();

  // [0] Match ReactPackage
  if (!lazyReactPackageRegex) {
    lazyReactPackageRegex =
      /class\s+(\w+[^(\s]*)[\s\w():]*(\s+implements\s+|:)[\s\w():,]*[^{]*ReactPackage/;
  }
  const matchReactPackage = fileContents.match(lazyReactPackageRegex);
  if (matchReactPackage) {
    return matchReactPackage[1];
  }

  // [1] Match (Base|Turbo)ReactPackage
  if (!lazyTurboReactPackageRegex) {
    lazyTurboReactPackageRegex =
      /class\s+(\w+[^(\s]*)[\s\w():]*(\s+extends\s+|:)[\s\w():,]*[^{]*(Base|Turbo)ReactPackage/;
  }
  const matchTurboReactPackage = fileContents.match(lazyTurboReactPackageRegex);
  if (matchTurboReactPackage) {
    return matchTurboReactPackage[1];
  }

  return null;
}

export async function parseLibraryNameAsync(
  androidDir: string,
  packageJson: any
): Promise<string | null> {
  // [0] `codegenConfig.name` from package.json
  if (packageJson.codegenConfig?.name) {
    return packageJson.codegenConfig.name;
  }

  const libraryNameRegExp = /libraryName = ["'](.+)["']/;
  const gradlePath = path.join(androidDir, 'build.gradle');
  // [1] `libraryName` from build.gradle
  if (await fileExistsAsync(gradlePath)) {
    const buildGradleContents = await fs.readFile(gradlePath, 'utf8');
    const match = buildGradleContents.match(libraryNameRegExp);
    if (match) {
      return match[1];
    }
  }

  // [2] `libraryName` from build.gradle.kts
  const gradleKtsPath = path.join(androidDir, 'build.gradle.kts');
  if (await fileExistsAsync(gradleKtsPath)) {
    const buildGradleContents = await fs.readFile(gradleKtsPath, 'utf8');
    const match = buildGradleContents.match(libraryNameRegExp);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function parseComponentDescriptorsAsync(
  packageRoot: string,
  packageJson: any
): Promise<string[]> {
  const jsRoot = packageJson?.codegenConfig?.jsSrcsDir
    ? path.join(packageRoot, packageJson.codegenConfig.jsSrcsDir)
    : packageRoot;
  const extRe = /\.[tj]sx?$/;
  const results = new Set<string>();
  for await (const entry of scanFilesRecursively(jsRoot)) {
    if (extRe.test(entry.name)) {
      const contents = await fs.readFile(entry.path);
      const matched = matchComponentDescriptors(entry.path, contents);
      if (matched) {
        results.add(matched);
      }
    }
  }
  return [...results].sort((a, b) => a.localeCompare(b));
}

let lazyCodegenComponentRegex: RegExp | null = null;
function matchComponentDescriptors(_filePath: string, contents: Buffer): string | null {
  const fileContents = contents.toString();

  if (!lazyCodegenComponentRegex) {
    lazyCodegenComponentRegex =
      /codegenNativeComponent(<.*>)?\s*\(\s*["'`](\w+)["'`](,?[\s\S]+interfaceOnly:\s*(\w+))?/m;
  }
  const match = fileContents.match(lazyCodegenComponentRegex);
  if (!(match?.[4] === 'true') && match?.[2]) {
    return `${match[2]}ComponentDescriptor`;
  }
  return null;
}

const findAndroidManifestsAsync = async (targetPath: string) => {
  const files = scanFilesRecursively(targetPath, (parentPath, name) => {
    switch (name) {
      case 'build':
      case 'debug':
      case 'Pods':
        return false;
      case 'Examples':
      case 'examples':
        // Only ignore top-level examples directories in `targetPath` but not nested ones
        return parentPath !== targetPath;
      case 'android':
        return !/[\\/]sdks[\\/]hermes$/.test(parentPath);
      case 'androidTest':
      case 'test':
        return !/[\\/]src$/.test(parentPath);
      default:
        return true;
    }
  });
  const manifestPaths: string[] = [];
  for await (const entry of files) {
    if (entry.name === 'AndroidManifest.xml') {
      manifestPaths.push(entry.path);
    }
  }
  return manifestPaths.sort((a, b) => a.localeCompare(b));
};

const getFileCandidatesAsync = async (targetPath: string, fileNames: string[]) => {
  const gradlePaths = await Promise.all(
    fileNames.map((fileName) => fileExistsAsync(path.join(targetPath, fileName)))
  );
  return gradlePaths.filter((file) => file != null).sort((a, b) => a.localeCompare(b));
};

export async function findGradleAndManifestAsync({
  androidDir,
  isLibrary,
}: {
  androidDir: string;
  isLibrary: boolean;
}): Promise<{ gradle: string | null; manifest: string | null }> {
  const [manifests, gradles] = await Promise.all([
    findAndroidManifestsAsync(androidDir),
    getFileCandidatesAsync(isLibrary ? androidDir : path.join(androidDir, 'app'), [
      'build.gradle',
      'build.gradle.kts',
    ]),
  ]);
  // TODO(@kitten): We can't optimise this because of the prior `includes()` pattern. Is this meant to be startsWith?
  const manifest =
    manifests.find((manifest) => manifest.includes('src/main/')) ??
    manifests.sort((a, b) => a.localeCompare(b))[0];
  const gradle = gradles.sort((a, b) => a.localeCompare(b))[0];
  return { gradle: gradle || null, manifest: manifest || null };
}
