"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosInlineModulesClassNames = getIosInlineModulesClassNames;
exports.isTargetInInlineModulesTargets = isTargetInInlineModulesTargets;
const inlineModules_1 = require("./inlineModules");
async function getIosInlineModulesClassNames(watchedDirectories, appRoot) {
    return (await (0, inlineModules_1.getMirrorStateObject)(watchedDirectories, appRoot)).swiftModuleClassNames.map((className) => {
        return {
            class: className,
            name: null,
        };
    });
}
function isTargetInInlineModulesTargets({ targetPath, inlineModulesTargets, }) {
    if (inlineModulesTargets.all) {
        return true;
    }
    const targetRegex = /\/Pods-(.+?)\/ExpoModulesProvider\.swift$/;
    const match = targetPath.match(targetRegex);
    if (!match) {
        return false;
    }
    const targetName = match[1];
    return targetName !== undefined && inlineModulesTargets.targets.includes(targetName);
}
//# sourceMappingURL=iosInlineModules.js.map