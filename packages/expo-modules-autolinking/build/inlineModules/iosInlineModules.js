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
function extractTargetNameFromPath(targetPath) {
    const targetRegex = /\/Pods-(.+?)\/ExpoModulesProvider\.swift$/;
    return targetPath.match(targetRegex)?.[1];
}
function isTargetInInlineModulesTargets({ targetName, targetPath, inlineModulesTargets, }) {
    const resolvedTargetName = targetName ?? extractTargetNameFromPath(targetPath);
    if (resolvedTargetName === undefined) {
        return false;
    }
    if (inlineModulesTargets.mainTarget) {
        return resolvedTargetName === inlineModulesTargets.mainTarget;
    }
    return inlineModulesTargets.targets.includes(resolvedTargetName);
}
//# sourceMappingURL=iosInlineModules.js.map