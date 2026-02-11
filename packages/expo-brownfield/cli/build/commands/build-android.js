"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("@expo/env");
const utils_1 = require("../utils");
const buildAndroid = async (command) => {
    await (0, utils_1.validatePrebuild)('android');
    (0, env_1.loadProjectEnv)(process.cwd());
    const config = (0, utils_1.resolveBuildConfigAndroid)(command.opts());
    if (!config.tasks.length) {
        utils_1.CLIError.handle('android-task-repo');
    }
    (0, utils_1.printAndroidConfig)(config);
    config.tasks.forEach(async (task) => {
        await (0, utils_1.runTask)(task, config.verbose, config.dryRun);
    });
};
exports.default = buildAndroid;
