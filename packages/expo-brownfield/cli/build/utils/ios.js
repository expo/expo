"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printIosConfig = exports.makeArtifactsDirectory = exports.findWorkspace = exports.findScheme = exports.createXcframework = exports.copyHermesXcframework = exports.buildFramework = exports.cleanUpArtifacts = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const commands_1 = require("./commands");
const error_1 = __importDefault(require("./error"));
const spinner_1 = require("./spinner");
const cleanUpArtifacts = async (config) => {
    if (config.dryRun) {
        console.log('Cleaning up previous artifacts');
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: async () => {
            if (!node_fs_1.default.existsSync(config.artifacts)) {
                return;
            }
            const xcframeworks = node_fs_1.default
                .readdirSync(config.artifacts)
                .filter((item) => item.endsWith('.xcframework'));
            xcframeworks.forEach((item) => {
                const itemPath = `${config.artifacts}/${item}`;
                node_fs_1.default.rmSync(itemPath, { recursive: true, force: true });
            });
        },
        loaderMessage: 'Cleaning up previous artifacts...',
        successMessage: 'Cleaning up previous artifacts succeeded',
        errorMessage: 'Cleaning up previous artifacts failed',
    });
};
exports.cleanUpArtifacts = cleanUpArtifacts;
const buildFramework = async (config) => {
    const args = [
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
        config.buildConfiguration,
    ];
    if (config.dryRun) {
        console.log(`xcodebuild ${args.join(' ')}`);
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: () => (0, commands_1.runCommand)('xcodebuild', args, { verbose: config.verbose }),
        loaderMessage: 'Compiling framework...',
        successMessage: 'Compiling framework succeeded',
        errorMessage: 'Compiling framework failed',
        verbose: config.verbose,
    });
};
exports.buildFramework = buildFramework;
const copyHermesXcframework = async (config) => {
    if (config.dryRun) {
        console.log(`Copying hermes XCFramework from ${config.hermesFrameworkPath} to ${config.artifacts}/hermes.xcframework`);
        return;
    }
    const sourcePath = `./ios/${config.hermesFrameworkPath}`;
    if (!node_fs_1.default.existsSync(sourcePath)) {
        error_1.default.handle('ios-hermes-framework-not-found', sourcePath);
    }
    return (0, spinner_1.withSpinner)({
        operation: async () => node_fs_1.default.cpSync(sourcePath, `${config.artifacts}/hermesvm.xcframework`, {
            force: true,
            recursive: true,
        }),
        loaderMessage: 'Copying hermesvm.xcframework to the artifacts directory...',
        successMessage: 'Copying hermesvm.xcframework to the artifacts directory succeeded',
        errorMessage: 'Copying hermesvm.xcframework to the artifacts directory failed',
        verbose: config.verbose,
    });
};
exports.copyHermesXcframework = copyHermesXcframework;
const createXcframework = async (config) => {
    const args = [
        '-create-xcframework',
        '-framework',
        `${config.device}/${config.scheme}.framework`,
        '-framework',
        `${config.simulator}/${config.scheme}.framework`,
        '-output',
        `${config.artifacts}/${config.scheme}.xcframework`,
    ];
    if (config.dryRun) {
        console.log(`xcodebuild ${args.join(' ')}`);
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: () => (0, commands_1.runCommand)('xcodebuild', args, { verbose: config.verbose }),
        loaderMessage: 'Packaging framework into an XCFramework...',
        successMessage: 'Packaging framework into an XCFramework succeeded',
        errorMessage: 'Packaging framework into an XCFramework failed',
        verbose: config.verbose,
    });
};
exports.createXcframework = createXcframework;
const findScheme = () => {
    try {
        const iosPath = node_path_1.default.join(process.cwd(), 'ios');
        if (!node_fs_1.default.existsSync(iosPath)) {
            error_1.default.handle('ios-directory-not-found');
        }
        const subdirectories = node_fs_1.default
            .readdirSync(iosPath, { withFileTypes: true })
            .filter((item) => item.isDirectory());
        const scheme = subdirectories.find((directory) => {
            const directoryPath = node_path_1.default.join(iosPath, directory.name);
            const files = node_fs_1.default.readdirSync(directoryPath, { recursive: true });
            return files.some((file) => typeof file === 'string' && file.endsWith('ReactNativeHostManager.swift'));
        });
        if (scheme) {
            return scheme.name;
        }
        error_1.default.handle('ios-scheme-not-found');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('ios-directory-unknown-error', errorMessage);
    }
};
exports.findScheme = findScheme;
const findWorkspace = () => {
    try {
        const iosPath = node_path_1.default.join(process.cwd(), 'ios');
        if (!node_fs_1.default.existsSync(iosPath)) {
            error_1.default.handle('ios-directory-not-found');
        }
        const items = node_fs_1.default.readdirSync(iosPath, { withFileTypes: true });
        const workspace = items.find((item) => item.name.endsWith('.xcworkspace'));
        if (workspace) {
            return node_path_1.default.join(iosPath, workspace.name);
        }
        error_1.default.handle('ios-workspace-not-found');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('ios-workspace-unknown-error', errorMessage);
    }
};
exports.findWorkspace = findWorkspace;
const makeArtifactsDirectory = (config) => {
    try {
        if (!node_fs_1.default.existsSync(config.artifacts)) {
            node_fs_1.default.mkdirSync(config.artifacts, { recursive: true });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('ios-artifacts-directory-unknown-error', errorMessage);
    }
};
exports.makeArtifactsDirectory = makeArtifactsDirectory;
const printIosConfig = (config) => {
    console.log(chalk_1.default.bold('Resolved build configuration'));
    console.log(` - Build configuration: ${chalk_1.default.blue(config.buildConfiguration)}`);
    console.log(` - Scheme: ${chalk_1.default.blue(config.scheme)}`);
    console.log(` - Workspace: ${chalk_1.default.blue(config.workspace)}`);
    console.log(` - Dry run: ${chalk_1.default.blue(config.dryRun)}`);
    console.log(` - Verbose: ${chalk_1.default.blue(config.verbose)}`);
    console.log(` - Artifacts path: ${chalk_1.default.blue(config.artifacts)}`);
    console.log();
};
exports.printIosConfig = printIosConfig;
