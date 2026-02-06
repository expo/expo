"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../utils");
const action = async () => {
    // const args = parseArgs({
    //   spec: Args.Android,
    //   // Skip first three args:
    //   // <node-path> expo-brownfield build:android
    //   argv: process.argv.slice(3),
    //   stopAtPositional: true,
    // });
    // if (getCommand(args)) {
    //   return Errors.additionalCommand('build:android');
    // }
    // // Only resolve --help and --verbose options
    // const basicConfig = getCommonConfig(args);
    // if (basicConfig.help) {
    //   console.log(Help.Android);
    //   return process.exit(0);
    // }
    // await ensurePrebuild('android');
    // const config = await getAndroidConfig(args);
    // printConfig(config);
    // let tasks = [];
    // if (config.tasks.length > 0) {
    //   tasks = config.tasks;
    // } else if (config.repositories.length > 0) {
    //   for (const repository of config.repositories) {
    //     const task = constructTask(config.buildType, repository);
    //     tasks.push(task);
    //   }
    // } else {
    //   Errors.missingTasksOrRepositories();
    // }
    // for (const task of tasks) {
    //   if (!config.dryRun) {
    //     await runTask(task, config.verbose);
    //   } else {
    //     console.log(`./gradlew ${task}`);
    //   }
    // }
    console.log('build:android');
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
