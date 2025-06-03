"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutOfTreePlatforms = getOutOfTreePlatforms;
const config_1 = require("@expo/config");
function getOutOfTreePlatforms(projectRoot) {
    const outOfTreePlatforms = [];
    const pkg = (0, config_1.getPackageJson)(projectRoot);
    if (pkg?.dependencies?.['react-native-macos']) {
        outOfTreePlatforms.push({ name: 'macos', package: 'react-native-macos' });
    }
    return outOfTreePlatforms;
}
//# sourceMappingURL=getOutOfTreePlatforms.js.map