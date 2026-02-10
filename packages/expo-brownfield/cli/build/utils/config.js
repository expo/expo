"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTasksConfigAndroid = exports.resolveBuildConfigIos = exports.resolveBuildConfigAndroid = void 0;
const node_path_1 = __importDefault(require("node:path"));
const android_1 = require("./android");
const ios_1 = require("./ios");
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
    const simulator = node_path_1.default.join(buildProductsPath, `${buildConfiguration.toLowerCase()}-iphonesimulator`);
    const hermesFrameworkPath = 'Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework';
    return {
        ...resolveCommonConfig(options),
        artifacts,
        buildConfiguration,
        derivedDataPath,
        device,
        simulator,
        hermesFrameworkPath,
        scheme: resolveScheme(options),
        workspace: resolveWorkspace(options),
    };
};
exports.resolveBuildConfigIos = resolveBuildConfigIos;
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
    return options.xcworkspace || (0, ios_1.findWorkspace)();
};
// END SECTION: iOS Helpers
