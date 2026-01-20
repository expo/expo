"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
const action = async () => {
    const args = (0, utils_1.parseArgs)({
        spec: constants_1.Args.IOS,
        argv: process.argv.slice(2),
    });
    await (0, utils_1.ensurePrebuild)('ios');
    const config = await (0, utils_1.getIosConfig)(args);
    if (config.help) {
        console.log(constants_1.Help.IOS);
        return process.exit(0);
    }
    (0, utils_1.printConfig)(config);
    await cleanUpArtifacts(config.artifacts);
    await runBuild(config);
    await packageFrameworks(config);
    await copyHermesFramework(config);
};
exports.default = action;
const cleanUpArtifacts = async (artifactsPath) => {
    return (0, utils_1.withSpinner)({
        operation: async () => {
            try {
                await promises_1.default.access(artifactsPath);
            }
            catch (error) {
                return;
            }
            const artifacts = (await promises_1.default.readdir(artifactsPath)).filter((artifact) => artifact.endsWith('.xcframework'));
            for (const artifact of artifacts) {
                await promises_1.default.rm(`${artifactsPath}/${artifact}`, {
                    recursive: true,
                    force: true,
                });
            }
        },
        loaderMessage: 'Cleaning up previous artifacts...',
        successMessage: 'Cleaning up previous artifacts succeeded',
        errorMessage: 'Cleaning up previous artifacts failed',
    });
};
const runBuild = async (config) => {
    return (0, utils_1.withSpinner)({
        operation: () => (0, utils_1.runCommand)('xcodebuild', [
            '-workspace',
            config.workspace,
            '-scheme',
            config.scheme,
            '-derivedDataPath',
            config.derivedDataPath,
            '-destination',
            'generic/platform=iphoneos',
            '-destination',
            'generic/platform=iphonesimulator',
            '-configuration',
            config.buildType.charAt(0).toUpperCase() + config.buildType.slice(1),
        ], {
            verbose: config.verbose,
        }),
        loaderMessage: 'Compiling framework...',
        successMessage: 'Compiling framework succeeded',
        errorMessage: 'Compiling framework failed',
        verbose: config.verbose,
    });
};
const packageFrameworks = async (config) => {
    return (0, utils_1.withSpinner)({
        operation: () => (0, utils_1.runCommand)('xcodebuild', [
            '-create-xcframework',
            '-framework',
            `${config.device}/${config.scheme}.framework`,
            '-framework',
            `${config.simulator}/${config.scheme}.framework`,
            '-output',
            `${config.artifacts}/${config.scheme}.xcframework`,
        ], {
            verbose: config.verbose,
        }),
        loaderMessage: 'Packaging framework into an XCFramework...',
        successMessage: 'Packaging framework into an XCFramework succeeded',
        errorMessage: 'Packaging framework into an XCFramework failed',
        verbose: config.verbose,
    });
};
const copyHermesFramework = async (config) => {
    return (0, utils_1.withSpinner)({
        operation: () => promises_1.default.cp(`./ios/${config.hermesFrameworkPath}`, `${config.artifacts}/hermes.xcframework`, {
            force: true,
            recursive: true,
        }),
        loaderMessage: 'Copying hermes.xcframework to the artifacts directory...',
        successMessage: 'Copying hermes.xcframework to the artifacts directory succeeded',
        errorMessage: 'Copying hermes.xcframework to the artifacts directory failed',
        verbose: config.verbose,
    });
};
