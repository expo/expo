"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
const action = async () => {
    const args = (0, utils_1.parseArgs)({
        spec: constants_1.Args.TasksAndroid,
        argv: process.argv.slice(2),
    });
    const config = await (0, utils_1.getTasksAndroidConfig)(args);
    if (config.help) {
        console.log(constants_1.Help.TasksAndroid);
        return process.exit(0);
    }
    const { stdout } = await (0, utils_1.withSpinner)({
        operation: () => (0, utils_1.runCommand)('./gradlew', [`${config.libraryName}:tasks`, '--group', 'publishing'], {
            cwd: node_path_1.default.join(process.cwd(), 'android'),
            verbose: config.verbose,
        }),
        loaderMessage: 'Reading publish tasks from the android project...',
        successMessage: 'Successfully read publish tasks from the android project\n',
        errorMessage: 'Failed to read publish tasks from the android project',
        verbose: config.verbose,
    });
    if (config.verbose) {
        // stdout is already printed to the console
        return;
    }
    const regex = /^publishBrownfield[a-zA-Z0-9_-]*/i;
    const publishTasks = stdout
        .split('\n')
        .map((line) => regex.exec(line)?.[0])
        // Remove duplicate maven local tasks
        .filter((task) => task && !task.includes('MavenLocalRepository'));
    console.log(chalk_1.default.bold('Publish tasks:'));
    publishTasks.forEach((task) => {
        console.log(`- ${task}`);
    });
    const splitRegex = /^publishBrownfield(?:All|Debug|Release)PublicationTo(.+?)(?:Repository)?$/;
    const repositories = [
        ...new Set(publishTasks
            .map((task) => {
            return splitRegex.exec(task)?.[1];
        })
            .filter((repo) => repo)),
    ];
    console.log(chalk_1.default.bold('\nRepositories:'));
    repositories.forEach((repo) => {
        console.log(`- ${repo}`);
    });
};
exports.default = action;
