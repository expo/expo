"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGradleAndManifestAsync = exports.parseComponentDescriptorsAsync = exports.parseLibraryNameAsync = exports.parseNativePackageClassNameAsync = exports.parsePackageNameAsync = exports.resolveDependencyConfigImplAndroidAsync = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const fileUtils_1 = require("../fileUtils");
async function resolveDependencyConfigImplAndroidAsync(packageRoot, reactNativeConfig) {
    if (reactNativeConfig === null) {
        // Skip autolinking for this package.
        return null;
    }
    const sourceDir = reactNativeConfig?.sourceDir || 'android';
    const androidDir = path_1.default.join(packageRoot, sourceDir);
    const { gradle, manifest } = await findGradleAndManifestAsync({ androidDir, isLibrary: true });
    if (!manifest && !gradle) {
        return null;
    }
    const packageName = reactNativeConfig?.packageName || (await parsePackageNameAsync(androidDir, manifest, gradle));
    if (!packageName) {
        return null;
    }
    const nativePackageClassName = await parseNativePackageClassNameAsync(packageRoot, androidDir);
    if (!nativePackageClassName) {
        return null;
    }
    const packageJson = JSON.parse(await promises_1.default.readFile(path_1.default.join(packageRoot, 'package.json'), 'utf8'));
    const packageImportPath = reactNativeConfig?.packageImportPath || `import ${packageName}.${nativePackageClassName};`;
    const packageInstance = reactNativeConfig?.packageInstance || `new ${nativePackageClassName}()`;
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
    };
    if (!result.libraryName) {
        delete result.libraryName;
    }
    if (!result.dependencyConfiguration) {
        delete result.dependencyConfiguration;
    }
    return result;
}
exports.resolveDependencyConfigImplAndroidAsync = resolveDependencyConfigImplAndroidAsync;
/**
 * Parse the `RNConfigDependencyAndroid.packageName`
 */
async function parsePackageNameAsync(androidDir, manifestPath, gradlePath) {
    if (gradlePath) {
        const gradleContents = await promises_1.default.readFile(path_1.default.join(androidDir, gradlePath), 'utf8');
        const match = gradleContents.match(/namespace\s*[=]*\s*["'](.+?)["']/);
        if (match) {
            return match[1];
        }
    }
    if (manifestPath) {
        const manifestContents = await promises_1.default.readFile(path_1.default.join(androidDir, manifestPath), 'utf8');
        const match = manifestContents.match(/package="(.+?)"/);
        if (match) {
            return match[1];
        }
    }
    return null;
}
exports.parsePackageNameAsync = parsePackageNameAsync;
/**
 * Parse the Java or Kotlin class name to for `ReactPackage` or `TurboReactPackage`.
 */
async function parseNativePackageClassNameAsync(packageRoot, androidDir) {
    const matched = await (0, fileUtils_1.globMatchFunctorFirstAsync)('**/*Package.{java,kt}', matchNativePackageClassName, { cwd: androidDir });
    if (matched) {
        return matched;
    }
    // Early return if the module is an Expo module
    if (await (0, fileUtils_1.fileExistsAsync)(path_1.default.join(packageRoot, 'expo-module.config.json'))) {
        return null;
    }
    return await (0, fileUtils_1.globMatchFunctorFirstAsync)('**/*.{java,kt}', matchNativePackageClassName, {
        cwd: androidDir,
    });
}
exports.parseNativePackageClassNameAsync = parseNativePackageClassNameAsync;
let lazyReactPackageRegex = null;
let lazyTurboReactPackageRegex = null;
function matchNativePackageClassName(filePath, contents) {
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
    // [1] Match TurboReactPackage
    if (!lazyTurboReactPackageRegex) {
        lazyTurboReactPackageRegex =
            /class\s+(\w+[^(\s]*)[\s\w():]*(\s+extends\s+|:)[\s\w():,]*[^{]*TurboReactPackage/;
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
    if (await (0, fileUtils_1.fileExistsAsync)(gradlePath)) {
        const buildGradleContents = await promises_1.default.readFile(gradlePath, 'utf8');
        const match = buildGradleContents.match(libraryNameRegExp);
        if (match) {
            return match[1];
        }
    }
    // [2] `libraryName` from build.gradle.kts
    const gradleKtsPath = path_1.default.join(androidDir, 'build.gradle.kts');
    if (await (0, fileUtils_1.fileExistsAsync)(gradleKtsPath)) {
        const buildGradleContents = await promises_1.default.readFile(gradleKtsPath, 'utf8');
        const match = buildGradleContents.match(libraryNameRegExp);
        if (match) {
            return match[1];
        }
    }
    return null;
}
exports.parseLibraryNameAsync = parseLibraryNameAsync;
async function parseComponentDescriptorsAsync(packageRoot, pacakgeJson) {
    const jsRoot = pacakgeJson?.codegenConfig?.jsSrcsDir
        ? path_1.default.join(packageRoot, pacakgeJson.codegenConfig.jsSrcsDir)
        : packageRoot;
    const results = await (0, fileUtils_1.globMatchFunctorAllAsync)('**/*.{js,jsx,ts,tsx}', matchComponentDescriptors, {
        cwd: jsRoot,
        ignore: ['**/node_modules/**'],
    });
    // Filter out duplicates as it happens that libraries contain multiple outputs due to package publishing.
    // TODO: consider using "codegenConfig" to avoid this.
    return Array.from(new Set(results));
}
exports.parseComponentDescriptorsAsync = parseComponentDescriptorsAsync;
let lazyCodegenComponentRegex = null;
function matchComponentDescriptors(filePath, contents) {
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
async function findGradleAndManifestAsync({ androidDir, isLibrary, }) {
    const globExcludes = [
        'node_modules/**',
        '**/build/**',
        '**/debug/**',
        'Examples/**',
        'examples/**',
        '**/Pods/**',
        '**/sdks/hermes/android/**',
        '**/src/androidTest/**',
        '**/src/test/**',
    ];
    const gradlePattern = isLibrary ? 'build.gradle{,.kts}' : 'app/build.gradle{,.kts}';
    const [manifests, gradles] = await Promise.all([
        (0, fast_glob_1.default)('**/AndroidManifest.xml', { cwd: androidDir, ignore: globExcludes }),
        (0, fast_glob_1.default)(gradlePattern, { cwd: androidDir, ignore: globExcludes }),
    ]);
    const manifest = manifests.find((manifest) => manifest.includes('src/main/')) ?? manifests[0];
    const gradle = gradles[0];
    return { gradle: gradle || null, manifest: manifest || null };
}
exports.findGradleAndManifestAsync = findGradleAndManifestAsync;
//# sourceMappingURL=androidResolver.js.map