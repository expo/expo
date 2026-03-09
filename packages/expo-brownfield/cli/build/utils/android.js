"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTask = exports.processTasks = exports.processRepositories = exports.printAndroidConfig = exports.findBrownfieldLibrary = exports.buildPublishingTask = void 0;
const chalk_1 = __importDefault(require("chalk"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const commands_1 = require("./commands");
const error_1 = __importDefault(require("./error"));
const spinner_1 = require("./spinner");
const buildPublishingTask = (variant, repository) => {
    const repositoryName = repository === 'MavenLocal' ? repository : `${repository}Repository`;
    return `publishBrownfield${variant}PublicationTo${repositoryName}`;
};
exports.buildPublishingTask = buildPublishingTask;
const findBrownfieldLibrary = () => {
    try {
        const androidPath = node_path_1.default.join(process.cwd(), 'android');
        if (!node_fs_1.default.existsSync(androidPath)) {
            error_1.default.handle('android-directory-not-found');
        }
        const subdirectories = node_fs_1.default
            .readdirSync(androidPath, { withFileTypes: true })
            .filter((item) => item.isDirectory());
        const brownfieldLibrary = subdirectories.find((directory) => {
            const directoryPath = node_path_1.default.join(androidPath, directory.name);
            const files = node_fs_1.default.readdirSync(directoryPath, { recursive: true });
            return files.some((file) => typeof file === 'string' && file.endsWith('ReactNativeHostManager.kt'));
        });
        if (brownfieldLibrary) {
            return brownfieldLibrary.name;
        }
        error_1.default.handle('android-library-not-found');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        error_1.default.handle('android-library-unknown-error', errorMessage);
    }
};
exports.findBrownfieldLibrary = findBrownfieldLibrary;
const printAndroidConfig = (config) => {
    console.log(chalk_1.default.bold('Resolved build configuration'));
    console.log(` - Build variant: ${chalk_1.default.blue(config.variant)}`);
    console.log(` - Library: ${chalk_1.default.blue(config.library)}`);
    console.log(` - Verbose: ${chalk_1.default.blue(config.verbose)}`);
    console.log(` - Dry run: ${chalk_1.default.blue(config.dryRun)}`);
    console.log(` - Tasks:`);
    config.tasks.forEach((task) => {
        console.log(`   - ${chalk_1.default.blue(task)}`);
    });
    console.log();
};
exports.printAndroidConfig = printAndroidConfig;
const processRepositories = (tasks) => {
    const splitRegex = /^publishBrownfield(?:All|Debug|Release)PublicationTo(.+?)(?:Repository)?$/;
    return Array.from(new Set(tasks
        .map((task) => {
        return splitRegex.exec(task)?.[1];
    })
        .filter((repo) => repo !== undefined)));
};
exports.processRepositories = processRepositories;
const processTasks = (stdout) => {
    const regex = /^publishBrownfield[a-zA-Z0-9_-]*/i;
    return (stdout
        .split('\n')
        .map((line) => regex.exec(line)?.[0])
        // Remove duplicate maven local tasks
        .filter((task) => task !== undefined)
        .filter((task) => !task.includes('MavenLocalRepository')));
};
exports.processTasks = processTasks;
const runTask = async (task, verbose, dryRun) => {
    if (dryRun) {
        console.log(`./gradlew ${task}`);
        return;
    }
    return (0, spinner_1.withSpinner)({
        operation: () => (0, commands_1.runCommand)('./gradlew', [task], {
            cwd: node_path_1.default.join(process.cwd(), 'android'),
            verbose,
        }),
        loaderMessage: 'Running task: ' + task,
        successMessage: 'Running task: ' + task + ' succeeded',
        errorMessage: 'Running task: ' + task + ' failed',
        verbose,
    });
};
exports.runTask = runTask;
