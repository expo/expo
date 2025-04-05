"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = void 0;
const utils_1 = require("./utils");
function getConfiguration(options) {
    const platformLinking = (0, utils_1.getLinkingImplementationForPlatform)(options.platform);
    return platformLinking.getConfiguration?.(options);
}
exports.getConfiguration = getConfiguration;
//# sourceMappingURL=getConfiguration.js.map