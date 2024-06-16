"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageListAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
/**
 * Generates a source file listing all packages to link.
 * Right know it works only for Android platform.
 */
async function generatePackageListAsync(modules, options) {
    try {
        const platformLinking = (0, utils_1.getLinkingImplementationForPlatform)(options.platform);
        await platformLinking.generatePackageListAsync(modules, options.target, options.namespace);
    }
    catch (e) {
        console.error(chalk_1.default.red(`Generating package list is not available for platform: ${options.platform}`));
        throw e;
    }
}
exports.generatePackageListAsync = generatePackageListAsync;
//# sourceMappingURL=generatePackageList.js.map