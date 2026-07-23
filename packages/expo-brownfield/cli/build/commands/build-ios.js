"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const buildIos = async (command) => {
    const opts = command.opts();
    await (0, utils_1.validatePrebuild)('ios', { dryRun: !!opts.dryRun });
    const config = (0, utils_1.resolveBuildConfigIos)(opts);
    (0, utils_1.printIosConfig)(config);
    (0, utils_1.validateHostProvided)(config);
    (0, utils_1.validateSchemeCollision)(config);
    await (0, utils_1.buildFramework)(config);
    if (config.output !== 'frameworks') {
        // Ship frameworks as swift package
        await (0, utils_1.shipSwiftPackage)(config);
    }
    else {
        // Ship frameworks as standalone XCFrameworks
        await (0, utils_1.shipFrameworks)(config);
    }
};
exports.default = buildIos;
//# sourceMappingURL=build-ios.js.map