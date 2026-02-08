"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const node_path_1 = __importDefault(require("node:path"));
const utils_1 = require("../utils");
const tasksAndroid = async (command) => {
    await (0, utils_1.validatePrebuild)('android');
    const config = (0, utils_1.resolveTasksConfigAndroid)(command.opts());
    const { stdout } = await (0, utils_1.withSpinner)({
        operation: () => (0, utils_1.runCommand)('./gradlew', [`${config.library}:tasks`, '--group', 'publishing'], {
            cwd: node_path_1.default.join(process.cwd(), 'android'),
            verbose: config.verbose,
        }),
        loaderMessage: 'Reading publish tasks from the android project...',
        successMessage: 'Successfully read publish tasks from the android project\n',
        errorMessage: 'Failed to read publish tasks from the android project',
        verbose: config.verbose,
    });
    // Forwarded stdout already contains the tasks
    if (config.verbose) {
        return;
    }
    console.log(chalk_1.default.bold('Publishing tasks'));
    const tasks = (0, utils_1.processTasks)(stdout);
    tasks.forEach((task) => {
        console.log(` - ${chalk_1.default.blue(task)}`);
    });
    console.log(chalk_1.default.bold('Repositories'));
    (0, utils_1.processRepositories)(tasks).forEach((repository) => {
        console.log(` - ${chalk_1.default.blue(repository)}`);
    });
};
exports.default = tasksAndroid;
