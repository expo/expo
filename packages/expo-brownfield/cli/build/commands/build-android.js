"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const buildAndroid = async (command) => {
    await (0, utils_1.validatePrebuild)('android');
    const config = (0, utils_1.resolveBuildConfigAndroid)(command.opts());
    if (!config.tasks.length) {
        utils_1.CLIError.handle('android-task-repo');
    }
    (0, utils_1.printAndroidConfig)(config);
    for (const task of config.tasks) {
        await (0, utils_1.runTask)(task, config.verbose, config.dryRun);
    }
};
exports.default = buildAndroid;
