"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = getConfiguration;
const utils_1 = require("./utils");
function getConfiguration(options) {
    const platformLinking = (0, utils_1.getLinkingImplementationForPlatform)(options.platform);
    return platformLinking.getConfiguration?.(options);
}
//# sourceMappingURL=getConfiguration.js.map