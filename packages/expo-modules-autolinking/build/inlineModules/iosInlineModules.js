"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosInlineModulesClassNames = getIosInlineModulesClassNames;
exports.isTargetInInlineModulesTargets = isTargetInInlineModulesTargets;
const inlineModules_1 = require("./inlineModules");
async function getIosInlineModulesClassNames(options) {
    const stateObject = await (0, inlineModules_1.getMirrorStateObject)(options);
    return stateObject.swiftModuleClassNames.map((className) => {
        return {
            class: className,
            name: null,
        };
    });
}
function isTargetInInlineModulesTargets({ targetPath, inlineModulesTargets, }) {
    const targetRegex = /\/Pods-(.+?)\/ExpoModulesProvider\.swift$/;
    const match = targetPath.match(targetRegex);
    if (!match) {
        return false;
    }
    const targetName = match[1];
    if (targetName === undefined) {
        return false;
    }
    if (inlineModulesTargets.mainTarget) {
        return targetName === inlineModulesTargets.mainTarget;
    }
    return inlineModulesTargets.targets.includes(targetName);
}
//# sourceMappingURL=iosInlineModules.js.map