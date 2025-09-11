"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageListAsync = generatePackageListAsync;
exports.generateModulesProviderAsync = generateModulesProviderAsync;
const platforms_1 = require("../platforms");
/** Generates a source file listing all packages to link (Android-only) */
async function generatePackageListAsync(modules, params) {
    const platformLinking = (0, platforms_1.getLinkingImplementationForPlatform)(params.platform);
    if (!('generatePackageListAsync' in platformLinking)) {
        throw new Error(`Generating package list is not available for platform "${params.platform}"`);
    }
    await platformLinking.generatePackageListAsync(modules, params.targetPath, params.namespace);
}
/** Generates ExpoModulesProvider file listing all packages to link (Apple-only)
 */
async function generateModulesProviderAsync(modules, params) {
    const platformLinking = (0, platforms_1.getLinkingImplementationForPlatform)(params.platform);
    if (!('generateModulesProviderAsync' in platformLinking)) {
        throw new Error(`Generating modules provider is not available for platform "${params.platform}"`);
    }
    await platformLinking.generateModulesProviderAsync(modules, params.targetPath, params.entitlementPath);
}
//# sourceMappingURL=generatePackageList.js.map