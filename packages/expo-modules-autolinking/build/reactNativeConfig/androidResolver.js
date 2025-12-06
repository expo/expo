"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDependencyConfigImplAndroidAsync = resolveDependencyConfigImplAndroidAsync;
exports.parsePackageNameAsync = parsePackageNameAsync;
exports.parseNativePackageClassNameAsync = parseNativePackageClassNameAsync;
exports.matchNativePackageClassName = matchNativePackageClassName;
exports.parseLibraryNameAsync = parseLibraryNameAsync;
exports.parseComponentDescriptorsAsync = parseComponentDescriptorsAsync;
exports.findGradleAndManifestAsync = findGradleAndManifestAsync;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
async function resolveDependencyConfigImplAndroidAsync(packageRoot, reactNativeConfig, expoModuleConfig) {
    if (reactNativeConfig === null) {
        // Skip autolinking for this package.
        return null;
    }
    // NOTE(@kitten): We allow `reactNativeConfig === undefined` here. That indicates a missing config file
    // However, React Native modules with left out config files are explicitly supported and valid
    const sourceDir = reactNativeConfig?.sourceDir || 'android';
    const androidDir = path_1.default.join(packageRoot, sourceDir);
    const { gradle, manifest } = await findGradleAndManifestAsync({ androidDir, isLibrary: true });
    const isPureCxxDependency = reactNativeConfig?.cxxModuleCMakeListsModuleName != null &&
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
    let packageInstance = null;
    let packageImportPath = null;
    if (!isPureCxxDependency) {
        const packageName = reactNativeConfig?.packageName || (await parsePackageNameAsync(manifest, gradle));
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
    const packageJson = JSON.parse(await promises_1.default.readFile(path_1.default.join(packageRoot, 'package.json'), 'utf8'));
    const buildTypes = reactNativeConfig?.buildTypes || [];
    const dependencyConfiguration = reactNativeConfig?.dependencyConfiguration;
    const libraryName = reactNativeConfig?.libraryName || (await parseLibraryNameAsync(androidDir, packageJson));
    const componentDescriptors = reactNativeConfig?.componentDescriptors ||
        (await parseComponentDescriptorsAsync(packageRoot, packageJson));
    let cmakeListsPath = reactNativeConfig?.cmakeListsPath
        ? path_1.default.join(androidDir, reactNativeConfig?.cmakeListsPath)
        : path_1.default.join(androidDir, 'build/generated/source/codegen/jni/CMakeLists.txt');
    const cxxModuleCMakeListsModuleName = reactNativeConfig?.cxxModuleCMakeListsModuleName || null;
    const cxxModuleHeaderName = reactNativeConfig?.cxxModuleHeaderName || null;
    let cxxModuleCMakeListsPath = reactNativeConfig?.cxxModuleCMakeListsPath
        ? path_1.default.join(androidDir, reactNativeConfig?.cxxModuleCMakeListsPath)
        : null;
    if (process.platform === 'win32') {
        cmakeListsPath = cmakeListsPath.replace(/\\/g, '/');
        if (cxxModuleCMakeListsPath) {
            cxxModuleCMakeListsPath = cxxModuleCMakeListsPath.replace(/\\/g, '/');
        }
    }
    const result = {
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
async function parsePackageNameAsync(manifestPath, gradlePath) {
    if (gradlePath) {
        const gradleContents = await promises_1.default.readFile(gradlePath, 'utf8');
        const match = gradleContents.match(/namespace\s*[=]*\s*["'](.+?)["']/);
        if (match) {
            return match[1];
        }
    }
    if (manifestPath) {
        const manifestContents = await promises_1.default.readFile(manifestPath, 'utf8');
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
async function parseNativePackageClassNameAsync(packageRoot, androidDir) {
    // Search for **/*Package.{java,kt} files first
    for await (const entry of (0, utils_1.scanFilesRecursively)(androidDir, undefined, true)) {
        if (entry.name.endsWith('Package.java') || entry.name.endsWith('Package.kt')) {
            try {
                const contents = await promises_1.default.readFile(entry.path);
                const matched = matchNativePackageClassName(entry.path, contents);
                if (matched) {
                    return matched;
                }
            }
            catch {
                continue;
            }
        }
    }
    // Early return if the module is an Expo module
    if (await (0, utils_1.fileExistsAsync)(path_1.default.join(packageRoot, 'expo-module.config.json'))) {
        return null;
    }
    // Search all **/*.{java,kt} files
    for await (const entry of (0, utils_1.scanFilesRecursively)(androidDir, undefined, true)) {
        if (entry.name.endsWith('.java') || entry.name.endsWith('.kt')) {
            const contents = await promises_1.default.readFile(entry.path);
            const matched = matchNativePackageClassName(entry.path, contents);
            if (matched) {
                return matched;
            }
        }
    }
    return null;
}
let lazyReactPackageRegex = null;
let lazyTurboReactPackageRegex = null;
function matchNativePackageClassName(_filePath, contents) {
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
async function parseLibraryNameAsync(androidDir, packageJson) {
    // [0] `codegenConfig.name` from package.json
    if (packageJson.codegenConfig?.name) {
        return packageJson.codegenConfig.name;
    }
    const libraryNameRegExp = /libraryName = ["'](.+)["']/;
    const gradlePath = path_1.default.join(androidDir, 'build.gradle');
    // [1] `libraryName` from build.gradle
    if (await (0, utils_1.fileExistsAsync)(gradlePath)) {
        const buildGradleContents = await promises_1.default.readFile(gradlePath, 'utf8');
        const match = buildGradleContents.match(libraryNameRegExp);
        if (match) {
            return match[1];
        }
    }
    // [2] `libraryName` from build.gradle.kts
    const gradleKtsPath = path_1.default.join(androidDir, 'build.gradle.kts');
    if (await (0, utils_1.fileExistsAsync)(gradleKtsPath)) {
        const buildGradleContents = await promises_1.default.readFile(gradleKtsPath, 'utf8');
        const match = buildGradleContents.match(libraryNameRegExp);
        if (match) {
            return match[1];
        }
    }
    return null;
}
async function parseComponentDescriptorsAsync(packageRoot, packageJson) {
    const jsRoot = packageJson?.codegenConfig?.jsSrcsDir
        ? path_1.default.join(packageRoot, packageJson.codegenConfig.jsSrcsDir)
        : packageRoot;
    const extRe = /\.[tj]sx?$/;
    const results = new Set();
    for await (const entry of (0, utils_1.scanFilesRecursively)(jsRoot)) {
        if (extRe.test(entry.name)) {
            const contents = await promises_1.default.readFile(entry.path);
            const matched = matchComponentDescriptors(entry.path, contents);
            if (matched) {
                results.add(matched);
            }
        }
    }
    return [...results].sort((a, b) => a.localeCompare(b));
}
let lazyCodegenComponentRegex = null;
function matchComponentDescriptors(_filePath, contents) {
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
const findAndroidManifestsAsync = async (targetPath) => {
    const files = (0, utils_1.scanFilesRecursively)(targetPath, (parentPath, name) => {
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
    const manifestPaths = [];
    for await (const entry of files) {
        if (entry.name === 'AndroidManifest.xml') {
            manifestPaths.push(entry.path);
        }
    }
    return manifestPaths.sort((a, b) => a.localeCompare(b));
};
const getFileCandidatesAsync = async (targetPath, fileNames) => {
    const gradlePaths = await Promise.all(fileNames.map((fileName) => (0, utils_1.fileExistsAsync)(path_1.default.join(targetPath, fileName))));
    return gradlePaths.filter((file) => file != null).sort((a, b) => a.localeCompare(b));
};
async function findGradleAndManifestAsync({ androidDir, isLibrary, }) {
    const [manifests, gradles] = await Promise.all([
        findAndroidManifestsAsync(androidDir),
        getFileCandidatesAsync(isLibrary ? androidDir : path_1.default.join(androidDir, 'app'), [
            'build.gradle',
            'build.gradle.kts',
        ]),
    ]);
    // TODO(@kitten): We can't optimise this because of the prior `includes()` pattern. Is this meant to be startsWith?
    const manifest = manifests.find((manifest) => manifest.includes('src/main/')) ??
        manifests.sort((a, b) => a.localeCompare(b))[0];
    const gradle = gradles.sort((a, b) => a.localeCompare(b))[0];
    return { gradle: gradle || null, manifest: manifest || null };
}
//# sourceMappingURL=androidResolver.js.map