"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHermesBytecodeBundleVersionAsync = exports.isHermesBytecodeBundleAsync = exports.maybeInconsistentEngineIosAsync = exports.maybeInconsistentEngineAndroidAsync = exports.maybeThrowFromInconsistentEngineAsync = exports.parseGradleProperties = exports.createHermesSourcemapAsync = exports.buildHermesBundleAsync = exports.isEnableHermesManaged = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const semver_1 = __importDefault(require("semver"));
const importMetroFromProject_1 = require("./metro/importMetroFromProject");
function isEnableHermesManaged(expoConfig, platform) {
    var _a, _b, _c, _d;
    switch (platform) {
        case 'android': {
            if (!gteSdkVersion(expoConfig, '42.0.0')) {
                // Hermes on Android is supported after SDK 42.
                return false;
            }
            return ((_b = (_a = expoConfig.android) === null || _a === void 0 ? void 0 : _a.jsEngine) !== null && _b !== void 0 ? _b : expoConfig.jsEngine) === 'hermes';
        }
        case 'ios': {
            if (!gteSdkVersion(expoConfig, '43.0.0')) {
                // Hermes on iOS is supported after SDK 43.
                return false;
            }
            return ((_d = (_c = expoConfig.ios) === null || _c === void 0 ? void 0 : _c.jsEngine) !== null && _d !== void 0 ? _d : expoConfig.jsEngine) === 'hermes';
        }
        default:
            return false;
    }
}
exports.isEnableHermesManaged = isEnableHermesManaged;
async function buildHermesBundleAsync(projectRoot, code, map, optimize = false) {
    const tempDir = path_1.default.join(os_1.default.tmpdir(), `expo-bundler-${process_1.default.pid}`);
    await fs_extra_1.default.ensureDir(tempDir);
    try {
        const tempBundleFile = path_1.default.join(tempDir, 'index.bundle');
        const tempSourcemapFile = path_1.default.join(tempDir, 'index.bundle.map');
        await fs_extra_1.default.writeFile(tempBundleFile, code);
        await fs_extra_1.default.writeFile(tempSourcemapFile, map);
        const tempHbcFile = path_1.default.join(tempDir, 'index.hbc');
        const hermesCommand = (0, importMetroFromProject_1.importHermesCommandFromProject)(projectRoot);
        const args = ['-emit-binary', '-out', tempHbcFile, tempBundleFile, '-output-source-map'];
        if (optimize) {
            args.push('-O');
        }
        await (0, spawn_async_1.default)(hermesCommand, args);
        const [hbc, sourcemap] = await Promise.all([
            fs_extra_1.default.readFile(tempHbcFile),
            createHermesSourcemapAsync(projectRoot, map, `${tempHbcFile}.map`),
        ]);
        return {
            hbc,
            sourcemap,
        };
    }
    finally {
        await fs_extra_1.default.remove(tempDir);
    }
}
exports.buildHermesBundleAsync = buildHermesBundleAsync;
async function createHermesSourcemapAsync(projectRoot, sourcemap, hermesMapFile) {
    const composeSourceMaps = (0, importMetroFromProject_1.importMetroSourceMapComposeSourceMapsFromProject)(projectRoot);
    const bundlerSourcemap = JSON.parse(sourcemap);
    const hermesSourcemap = await fs_extra_1.default.readJSON(hermesMapFile);
    return JSON.stringify(composeSourceMaps([bundlerSourcemap, hermesSourcemap]));
}
exports.createHermesSourcemapAsync = createHermesSourcemapAsync;
function parseGradleProperties(content) {
    const result = {};
    for (let line of content.split('\n')) {
        line = line.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }
        const sepIndex = line.indexOf('=');
        const key = line.substr(0, sepIndex);
        const value = line.substr(sepIndex + 1);
        result[key] = value;
    }
    return result;
}
exports.parseGradleProperties = parseGradleProperties;
async function maybeThrowFromInconsistentEngineAsync(projectRoot, configFilePath, platform, isHermesManaged) {
    const configFileName = path_1.default.basename(configFilePath);
    if (platform === 'android' &&
        (await maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged))) {
        throw new Error(`JavaScript engine configuration is inconsistent between ${configFileName} and Android native project.\n` +
            `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` +
            `In Android native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` +
            `Please check the following files for inconsistencies:\n` +
            `  - ${configFilePath}\n` +
            `  - ${path_1.default.join(projectRoot, 'android', 'gradle.properties')}\n` +
            `  - ${path_1.default.join(projectRoot, 'android', 'app', 'build.gradle')}\n` +
            'Learn more: https://expo.fyi/hermes-android-config');
    }
    if (platform === 'ios' && (await maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged))) {
        throw new Error(`JavaScript engine configuration is inconsistent between ${configFileName} and iOS native project.\n` +
            `In ${configFileName}: Hermes is ${isHermesManaged ? 'enabled' : 'not enabled'}\n` +
            `In iOS native project: Hermes is ${isHermesManaged ? 'not enabled' : 'enabled'}\n` +
            `Please check the following files for inconsistencies:\n` +
            `  - ${configFilePath}\n` +
            `  - ${path_1.default.join(projectRoot, 'ios', 'Podfile')}\n` +
            `  - ${path_1.default.join(projectRoot, 'ios', 'Podfile.properties.json')}\n` +
            'Learn more: https://expo.fyi/hermes-ios-config');
    }
}
exports.maybeThrowFromInconsistentEngineAsync = maybeThrowFromInconsistentEngineAsync;
async function maybeInconsistentEngineAndroidAsync(projectRoot, isHermesManaged) {
    // Trying best to check android native project if by chance to be consistent between app config
    // Check android/app/build.gradle for "enableHermes: true"
    const appBuildGradlePath = path_1.default.join(projectRoot, 'android', 'app', 'build.gradle');
    if (fs_extra_1.default.existsSync(appBuildGradlePath)) {
        const content = await fs_extra_1.default.readFile(appBuildGradlePath, 'utf8');
        const isPropsReference = content.search(/^\s*enableHermes:\s*\(findProperty\('expo.jsEngine'\) \?: "jsc"\) == "hermes",?\s+/m) >= 0;
        const isHermesBare = content.search(/^\s*enableHermes:\s*true,?\s+/m) >= 0;
        if (!isPropsReference && isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    // Check gradle.properties from prebuild template
    const gradlePropertiesPath = path_1.default.join(projectRoot, 'android', 'gradle.properties');
    if (fs_extra_1.default.existsSync(gradlePropertiesPath)) {
        const props = parseGradleProperties(await fs_extra_1.default.readFile(gradlePropertiesPath, 'utf8'));
        const isHermesBare = props['expo.jsEngine'] === 'hermes';
        if (isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    return false;
}
exports.maybeInconsistentEngineAndroidAsync = maybeInconsistentEngineAndroidAsync;
async function maybeInconsistentEngineIosAsync(projectRoot, isHermesManaged) {
    // Trying best to check ios native project if by chance to be consistent between app config
    // Check ios/Podfile for ":hermes_enabled => true"
    const podfilePath = path_1.default.join(projectRoot, 'ios', 'Podfile');
    if (fs_extra_1.default.existsSync(podfilePath)) {
        const content = await fs_extra_1.default.readFile(podfilePath, 'utf8');
        const hermesPropReferences = [
            // sdk 45
            /^\s*:hermes_enabled\s*=>\s*flags\[:hermes_enabled\]\s*\|\|\s*podfile_properties\['expo.jsEngine'\]\s*==\s*'hermes',?/m,
            // <= sdk 44
            /^\s*:hermes_enabled\s*=>\s*podfile_properties\['expo.jsEngine'\] == 'hermes',?\s+/m,
        ];
        const isPropsReference = hermesPropReferences.reduce((prev, curr) => prev || content.search(curr) >= 0, false);
        const isHermesBare = content.search(/^\s*:hermes_enabled\s*=>\s*true,?\s+/m) >= 0;
        if (!isPropsReference && isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    // Check Podfile.properties.json from prebuild template
    const podfilePropertiesPath = path_1.default.join(projectRoot, 'ios', 'Podfile.properties.json');
    if (fs_extra_1.default.existsSync(podfilePropertiesPath)) {
        const props = await parsePodfilePropertiesAsync(podfilePropertiesPath);
        const isHermesBare = props['expo.jsEngine'] === 'hermes';
        if (isHermesManaged !== isHermesBare) {
            return true;
        }
    }
    return false;
}
exports.maybeInconsistentEngineIosAsync = maybeInconsistentEngineIosAsync;
// https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
const HERMES_MAGIC_HEADER = 'c61fbc03c103191f';
async function isHermesBytecodeBundleAsync(file) {
    const header = await readHermesHeaderAsync(file);
    return header.slice(0, 8).toString('hex') === HERMES_MAGIC_HEADER;
}
exports.isHermesBytecodeBundleAsync = isHermesBytecodeBundleAsync;
async function getHermesBytecodeBundleVersionAsync(file) {
    const header = await readHermesHeaderAsync(file);
    if (header.slice(0, 8).toString('hex') !== HERMES_MAGIC_HEADER) {
        throw new Error('Invalid hermes bundle file');
    }
    return header.readUInt32LE(8);
}
exports.getHermesBytecodeBundleVersionAsync = getHermesBytecodeBundleVersionAsync;
async function readHermesHeaderAsync(file) {
    const fd = await fs_extra_1.default.open(file, 'r');
    const buffer = Buffer.alloc(12);
    await fs_extra_1.default.read(fd, buffer, 0, 12, null);
    await fs_extra_1.default.close(fd);
    return buffer;
}
// Cloned from xdl/src/Versions.ts, we cannot use that because of circular dependency
function gteSdkVersion(expJson, sdkVersion) {
    if (!expJson.sdkVersion) {
        return false;
    }
    if (expJson.sdkVersion === 'UNVERSIONED') {
        return true;
    }
    try {
        return semver_1.default.gte(expJson.sdkVersion, sdkVersion);
    }
    catch {
        throw new Error(`${expJson.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
    }
}
async function parsePodfilePropertiesAsync(podfilePropertiesPath) {
    try {
        return JSON.parse(await fs_extra_1.default.readFile(podfilePropertiesPath, 'utf8'));
    }
    catch {
        return {};
    }
}
//# sourceMappingURL=HermesBundler.js.map