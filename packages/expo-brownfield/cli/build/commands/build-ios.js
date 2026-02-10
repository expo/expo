"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const buildIos = async (command) => {
    await (0, utils_1.validatePrebuild)('ios');
    const config = (0, utils_1.resolveBuildConfigIos)(command.opts());
    (0, utils_1.printIosConfig)(config);
    await (0, utils_1.cleanUpArtifacts)(config);
    await (0, utils_1.buildFramework)(config);
    await (0, utils_1.createXcframework)(config);
};
exports.default = buildIos;
