"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = getConfiguration;
const platforms_1 = require("../platforms");
function getConfiguration({ autolinkingOptions, }) {
    const platformLinking = (0, platforms_1.getLinkingImplementationForPlatform)(autolinkingOptions.platform);
    if ('getConfiguration' in platformLinking) {
        return platformLinking.getConfiguration(autolinkingOptions);
    }
    else {
        return undefined;
    }
}
//# sourceMappingURL=getConfiguration.js.map