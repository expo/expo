"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipSwiftPackage = exports.shipFrameworks = exports.printIosConfig = exports.makeArtifactsDirectory = exports.findWorkspace = exports.findScheme = exports.createXCframework = exports.copyXCFrameworks = exports.buildFramework = exports.cleanUpArtifacts = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const commands_1 = require("./commands");
const constants_1 = require("./constants");
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
const copyXCFrameworks = async (config, dest) => {
    const xcframeworks = Object.keys(constants_1.XCFramework).map((framework) => ({
        name: node_path_1.default.basename(constants_1.XCFramework[framework]),
        path: constants_1.XCFramework[framework],
    }));
    for (const xcframework of xcframeworks) {
        const sourcePath = node_path_1.default.join('ios', xcframework.path);
        if (node_fs_1.default.existsSync(sourcePath)) {
            return (0, spinner_1.withSpinner)({
                operation: async () => node_fs_1.default.promises.cp(sourcePath, node_path_1.default.join(dest, xcframework.name), {
                    force: true,
                    recursive: true,
                }),
                loaderMessage: `Copying ${xcframework.name} to the artifacts directory...`,
                successMessage: `Copying ${xcframework.name} to the artifacts directory succeeded`,
                errorMessage: `Copying ${xcframework.name} to the artifacts directory failed`,
                verbose: config.verbose,
            });
        }
        else if (xcframework.name === 'hermesvm.xcframework') {
            error_1.default.handle('ios-hermes-framework-not-found', sourcePath);
        }
    }
};
exports.copyXCFrameworks = copyXCFrameworks;
const createXCframework = async (config, at) => {
    const frameworkName = `${config.scheme}.xcframework`;
    const outputPath = node_path_1.default.join(at, frameworkName);
    const args = [
        '-create-xcframework',
        '-framework',
        `${config.device}/${config.scheme}.framework`,
        '-framework',
        `${config.simulator}/${config.scheme}.framework`,
        '-output',
        outputPath,
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
exports.createXCframework = createXCframework;
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
const shipFrameworks = async (config) => {
    // Create artifacts directory
    await (0, exports.cleanUpArtifacts)(config);
    (0, exports.makeArtifactsDirectory)(config);
    // Copy/create XCFrameworks into the package
    await (0, exports.createXCframework)(config, config.artifacts);
    await (0, exports.copyXCFrameworks)(config, config.artifacts);
};
exports.shipFrameworks = shipFrameworks;
// TODO(pmleczek): Uncomment once rebased
const shipSwiftPackage = async (config) => {
    // Create artifacts directory and swift package
    await (0, exports.cleanUpArtifacts)(config);
    (0, exports.makeArtifactsDirectory)(config);
    // const packagePath = await createSwiftPackage(config);
    // const xcframeworksPath = path.join(packagePath, 'xcframeworks');
    // Copy/create XCFrameworks into the package
    // await createXCframework(config, xcframeworksPath);
    // await copyXCFrameworks(config, xcframeworksPath);
};
exports.shipSwiftPackage = shipSwiftPackage;
