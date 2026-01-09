"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildTypeAndroid = exports.getBuildTypeCommon = exports.getTasksAndroidConfig = exports.getIosConfig = exports.getAndroidConfig = exports.getCommonConfig = void 0;
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../constants");
const infer_1 = require("./infer");
const getCommonConfig = (args) => {
    return {
        help: !!args['--help'],
        verbose: !!args['--verbose'],
    };
};
exports.getCommonConfig = getCommonConfig;
const getAndroidConfig = async (args) => {
    return {
        ...(0, exports.getCommonConfig)(args),
        buildType: (0, exports.getBuildTypeAndroid)(args),
        libraryName: args['--library'] || (await (0, infer_1.inferAndroidLibrary)()),
        repositories: args['--repository'] || [],
        tasks: args['--task'] || [],
    };
};
exports.getAndroidConfig = getAndroidConfig;
const getIosConfig = async (args) => {
    const buildType = (0, exports.getBuildTypeCommon)(args);
    const derivedDataPath = node_path_1.default.join(process.cwd(), 'ios/build');
    const buildProductsPath = node_path_1.default.join(derivedDataPath, 'Build/Products');
    return {
        ...(0, exports.getCommonConfig)(args),
        artifacts: node_path_1.default.join(process.cwd(), args['--artifacts'] || constants_1.Defaults.artifactsPath),
        buildType,
        derivedDataPath,
        device: node_path_1.default.join(buildProductsPath, `${buildType}-iphoneos`),
        simulator: node_path_1.default.join(buildProductsPath, `${buildType}-iphonesimulator`),
        hermesFrameworkPath: args['--hermes-framework'] || constants_1.Defaults.hermesFrameworkPath,
        scheme: args['--scheme'] || (await (0, infer_1.inferScheme)()),
        workspace: args['--workspace'] || (await (0, infer_1.inferXCWorkspace)()),
    };
};
exports.getIosConfig = getIosConfig;
const getTasksAndroidConfig = async (args) => {
    return {
        ...(0, exports.getCommonConfig)(args),
        libraryName: args['--library'] || (await (0, infer_1.inferAndroidLibrary)()),
    };
};
exports.getTasksAndroidConfig = getTasksAndroidConfig;
const getBuildTypeCommon = (args) => {
    return !args['--release'] && args['--debug'] ? 'debug' : 'release';
};
exports.getBuildTypeCommon = getBuildTypeCommon;
const getBuildTypeAndroid = (args) => {
    if ((args['--debug'] && args['--release']) || (!args['--debug'] && !args['--release'])) {
        return 'all';
    }
    return (0, exports.getBuildTypeCommon)(args);
};
exports.getBuildTypeAndroid = getBuildTypeAndroid;
