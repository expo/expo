"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const buildIos = async (command) => {
    await (0, utils_1.validatePrebuild)('ios');
    const config = (0, utils_1.resolveBuildConfigIos)(command.opts());
    (0, utils_1.printIosConfig)(config);
    await (0, utils_1.buildFramework)(config);
    if (config.output !== 'frameworks') {
        // Ship frameworks as swift package
        (0, utils_1.shipSwiftPackage)(config);
    }
    else {
        // Ship frameworks as standalone XCFrameworks
        (0, utils_1.shipFrameworks)(config);
    }
};
exports.default = buildIos;
