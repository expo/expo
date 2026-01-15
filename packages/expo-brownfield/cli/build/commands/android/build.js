"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
const action = async () => {
    const args = (0, utils_1.parseArgs)({ spec: constants_1.Args.Android, argv: process.argv.slice(2) });
    await (0, utils_1.ensurePrebuild)('android');
    const config = await (0, utils_1.getAndroidConfig)(args);
    if (config.help) {
        console.log(constants_1.Help.Android);
        return process.exit(0);
    }
    (0, utils_1.printConfig)(config);
    let tasks = [];
    if (config.tasks.length > 0) {
        tasks = config.tasks;
    }
    else {
        for (const repository of config.repositories) {
            const task = constructTask(config.buildType, repository);
            tasks.push(task);
        }
    }
    for (const task of tasks) {
        await runTask(task, config.verbose);
    }
};
exports.default = action;
const constructTask = (buildType, repository) => {
    const buildTypeCapitalized = buildType[0].toUpperCase() + buildType.slice(1);
    const repositorySuffixed = repository === 'MavenLocal' ? repository : `${repository}Repository`;
    return `publishBrownfield${buildTypeCapitalized}PublicationTo${repositorySuffixed}`;
};
const runTask = async (task, verbose) => {
    return (0, utils_1.withSpinner)({
        operation: () => (0, utils_1.runCommand)('./gradlew', [task], {
            cwd: path_1.default.join(process.cwd(), 'android'),
            verbose,
        }),
        loaderMessage: 'Running task: ' + task,
        successMessage: 'Running task: ' + task + ' succeeded',
        errorMessage: 'Running task: ' + task + ' failed',
        verbose,
    });
};
