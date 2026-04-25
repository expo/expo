"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNativeModuleAsync = isNativeModuleAsync;
const concurrency_1 = require("../concurrency");
const dependencies_1 = require("../dependencies");
/** Check if a path is potentially a native module */
async function isNativeModuleAsync(maybeModulePath) {
    const resolution = await (0, dependencies_1.mockDependencyAtPath)(maybeModulePath);
    const excludeNames = new Set();
    const isNativeModules = await (0, concurrency_1.taskAll)(['android', 'apple'], (platform) => (0, dependencies_1.isNativeModuleAsync)(resolution, null, platform, excludeNames));
    return isNativeModules.some((x) => !!x);
}
//# sourceMappingURL=isNativeModule.js.map