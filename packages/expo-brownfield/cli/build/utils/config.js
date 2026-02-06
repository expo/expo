"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTasksConfigAndroid = exports.resolveBuildConfigIos = exports.resolveBuildConfigAndroid = void 0;
const android_1 = require("./android");
// export const getIosConfig = async (args: Result<Spec>): Promise<BuildConfigIos> => {
//   const buildType = getBuildTypeCommon(args);
//   const derivedDataPath = path.join(process.cwd(), 'ios/build');
//   const buildProductsPath = path.join(derivedDataPath, 'Build/Products');
//   return {
//     ...getCommonConfig(args),
//     artifacts: path.join(process.cwd(), args['--artifacts'] || Defaults.artifactsPath),
//     buildType,
//     derivedDataPath,
//     device: path.join(buildProductsPath, `${buildType}-iphoneos`),
//     simulator: path.join(buildProductsPath, `${buildType}-iphonesimulator`),
//     hermesFrameworkPath: args['--hermes-framework'] || Defaults.hermesFrameworkPath,
//     scheme: args['--scheme'] || (await inferScheme()),
//     workspace: args['--xcworkspace'] || (await inferXCWorkspace()),
//   };
// };
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
    return {
        ...resolveCommonConfig(options),
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
