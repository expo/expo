"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTasksConfigAndroid = exports.resolveBuildConfigIos = exports.resolveBuildConfigAndroid = void 0;
const config_1 = require("expo/config");
const node_path_1 = __importDefault(require("node:path"));
const android_1 = require("./android");
const ios_1 = require("./ios");
const resolveBuildConfigAndroid = (options) => {
    const fused = !!options.fused;
    const variant = resolveVariant(options);
    const library = resolveLibrary(options);
    return {
        ...resolveCommonConfig(options),
        library,
        tasks: resolveTaskArray(options, variant, { fused, library }),
        variant,
        fused,
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
    const hermesFrameworkPath = 'Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework';
    const packageName = options.package && typeof options.package === 'string' ? options.package : `${scheme}Artifacts`;
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
        simulator,
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
const resolveTaskArray = (options, variant, fusedOpts) => {
    const tasks = options.task ?? [];
    let repositories = options.repository ?? [];
    if (tasks.length === 0 && repositories.length === 0) {
        repositories = resolveLocalRepositoriesFromAppConfig(!!options.verbose);
        if (repositories.length > 0) {
            console.info(`No --repo or --task specified; defaulting to local repositories from the app config: ${repositories.join(', ')}`);
        }
    }
    // In `--fused` mode, `--all` expands to separate Debug + Release task
    // invocations against the matching sibling subprojects.
    const variantsForRepoTasks = fusedOpts.fused && variant === 'All' ? ['Debug', 'Release'] : [variant];
    const repoTasks = repositories.flatMap((repo) => variantsForRepoTasks.map((v) => (0, android_1.buildPublishingTask)(v, repo, fusedOpts)));
    return Array.from(new Set([...tasks, ...repoTasks]));
};
const resolveLocalRepositoriesFromAppConfig = (verbose) => {
    let publishing;
    try {
        const { exp } = (0, config_1.getConfig)(process.cwd(), { skipSDKVersionRequirement: true });
        const plugin = exp.plugins?.find((entry) => Array.isArray(entry) && entry[0] === 'expo-brownfield');
        publishing = plugin?.[1]?.android?.publishing;
    }
    catch (error) {
        // App config could not be evaluated here — fall through to the plugin's
        // default publishing target below.
        if (verbose) {
            console.warn(`Could not read \`android.publishing\` from the app config, falling back to MavenLocal: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    const entries = Array.isArray(publishing) && publishing.length > 0 ? publishing : [{ type: 'localMaven' }];
    const repositories = entries.flatMap((entry) => {
        if (entry?.type === 'localMaven') {
            return ['MavenLocal'];
        }
        if (entry?.type === 'localDirectory' && typeof entry?.name === 'string') {
            return [entry.name];
        }
        return [];
    });
    return Array.from(new Set(repositories));
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
