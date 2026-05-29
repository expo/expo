"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTasksConfigAndroid = exports.resolveBuildConfigIos = exports.resolveBuildConfigAndroid = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const android_1 = require("./android");
const ios_1 = require("./ios");
const precompiled_1 = require("./precompiled");
const build_1 = require("../../../shared/build");
const resolveBuildConfigAndroid = (options) => {
    const variant = resolveVariant(options);
    return {
        ...resolveCommonConfig(options),
        library: resolveLibrary(options),
        tasks: resolveTaskArray(options, variant),
        variant,
    };
};
exports.resolveBuildConfigAndroid = resolveBuildConfigAndroid;
const resolveBuildConfigIos = (options) => {
    let artifacts = options.artifacts || './artifacts';
    if (!node_path_1.default.isAbsolute(artifacts)) {
        artifacts = node_path_1.default.join(process.cwd(), artifacts);
    }
    const derivedDataPath = node_path_1.default.join(process.cwd(), 'ios/build');
    const buildProductsPath = node_path_1.default.join(derivedDataPath, 'Build/Products');
    const buildConfiguration = resolveBuildConfiguration(options);
    const device = node_path_1.default.join(buildProductsPath, `${buildConfiguration.toLowerCase()}-iphoneos`);
    const scheme = resolveScheme(options);
    const simulator = node_path_1.default.join(buildProductsPath, `${buildConfiguration.toLowerCase()}-iphonesimulator`);
    // Detect prebuilt Expo module xcframeworks dropped into ios/Pods/ when the project's
    // expo-build-properties config sets `ios.usePrecompiledModules` (or the user ran
    // `EXPO_USE_PRECOMPILED_MODULES=1 pod install` manually). When present we bundle every
    // precompiled module into the SPM output and emit the aggregate-product Package.swift.
    const usePrebuilds = (0, precompiled_1.enumeratePrecompiledModules)(node_path_1.default.join(process.cwd(), 'ios')).length > 0;
    const basePackageName = options.package && typeof options.package === 'string' ? options.package : `${scheme}Artifacts`;
    // SPM .binaryTarget has no per-configuration overload, so when prebuilds are bundled we
    // produce one flavored package per build configuration (e.g. "MyAppPackage-release").
    const packageName = usePrebuilds
        ? `${basePackageName}-${buildConfiguration.toLowerCase()}`
        : basePackageName;
    const output = options.package
        ? {
            packageName,
        }
        : 'frameworks';
    return {
        ...resolveCommonConfig(options),
        artifacts,
        output,
        buildConfiguration,
        derivedDataPath,
        device,
        hostProvidedFrameworks: resolveHostProvidedFrameworks(options),
        simulator,
        scheme: resolveScheme(options),
        usePrebuilds,
        workspace: resolveWorkspace(options),
    };
};
exports.resolveBuildConfigIos = resolveBuildConfigIos;
/**
 * Source order for `hostProvidedFrameworks`:
 *  1. `--host-provided <names...>` from the CLI flag
 *  2. `ios.brownfieldHostProvidedFrameworks` in `ios/Podfile.properties.json`
 *
 * Inputs are intentionally not merged. This is designed for CI smoke tests and quick repros.
 */
const resolveHostProvidedFrameworks = (options) => {
    const fromFlag = parseHostProvidedFlag(options.hostProvided);
    if (fromFlag.length > 0) {
        return fromFlag;
    }
    return readHostProvidedFromPodfileProperties(process.cwd());
};
const parseHostProvidedFlag = (value) => {
    if (value == null) {
        return [];
    }
    const raw = Array.isArray(value) ? value : [value];
    const names = raw
        .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    return Array.from(new Set(names));
};
const readHostProvidedFromPodfileProperties = (cwd) => {
    const propertiesPath = node_path_1.default.join(cwd, 'ios', 'Podfile.properties.json');
    if (!node_fs_1.default.existsSync(propertiesPath)) {
        return [];
    }
    let properties;
    try {
        properties = JSON.parse(node_fs_1.default.readFileSync(propertiesPath, 'utf8'));
    }
    catch {
        // Malformed properties file — prebuild would normally repair it. Treat as "no host-provided"
        // and let other parts of the CLI surface the actual problem.
        return [];
    }
    const rawValue = properties[build_1.HOST_PROVIDED_FRAMEWORKS_KEY];
    if (typeof rawValue !== 'string' || rawValue.length === 0) {
        return [];
    }
    let parsed;
    try {
        parsed = JSON.parse(rawValue);
    }
    catch {
        return [];
    }
    if (!Array.isArray(parsed)) {
        return [];
    }
    return Array.from(new Set(parsed
        .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
        .map((entry) => entry.trim())));
};
const resolveTasksConfigAndroid = (options) => {
    return {
        ...resolveCommonConfig(options),
        library: resolveLibrary(options),
    };
};
exports.resolveTasksConfigAndroid = resolveTasksConfigAndroid;
const resolveCommonConfig = (options) => {
    return {
        dryRun: !!options.dryRun,
        verbose: !!options.verbose,
    };
};
// SECTION: Android Helpers
const resolveLibrary = (options) => {
    return options.library || (0, android_1.findBrownfieldLibrary)();
};
const resolveTaskArray = (options, variant) => {
    const tasks = options.task ?? [];
    const repoTasks = (options.repository ?? []).map((repo) => (0, android_1.buildPublishingTask)(variant, repo));
    return Array.from(new Set([...tasks, ...repoTasks]));
};
const resolveVariant = (options) => {
    let variant = 'All';
    if (options.release && !options.debug) {
        variant = 'Release';
    }
    if (options.debug && !options.release) {
        variant = 'Debug';
    }
    return variant;
};
// END SECTION: Android Helpers
// SECTION: iOS Helpers
const resolveBuildConfiguration = (options) => {
    let buildConfiguration = 'Release';
    if (options.debug && !options.release) {
        buildConfiguration = 'Debug';
    }
    return buildConfiguration;
};
const resolveScheme = (options) => {
    return options.scheme || (0, ios_1.findScheme)();
};
const resolveWorkspace = (options) => {
    return options.xcworkspace || (0, ios_1.findWorkspace)(options.dryRun);
};
// END SECTION: iOS Helpers
//# sourceMappingURL=config.js.map