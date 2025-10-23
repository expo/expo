"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosInlineModulesClassNames = getIosInlineModulesClassNames;
const inlineModules_1 = require("./inlineModules");
async function getIosInlineModulesClassNames(watchedDirectories) {
    return (await (0, inlineModules_1.getMirrorStateObject)(watchedDirectories)).swiftModuleClassNames.map((className) => {
        return {
            class: className,
            name: null,
        };
    });
}
//# sourceMappingURL=iosInlineModules.js.map