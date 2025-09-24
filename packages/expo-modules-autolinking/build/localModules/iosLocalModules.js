"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosLocalModulesClassNames = getIosLocalModulesClassNames;
const localModules_1 = require("./localModules");
async function getIosLocalModulesClassNames(watchedDirs) {
    return (await (0, localModules_1.getMirrorStateObject)(watchedDirs)).swiftModuleClassNames.map((className) => {
        return {
            name: className,
            class: className,
        };
    });
}
//# sourceMappingURL=iosLocalModules.js.map