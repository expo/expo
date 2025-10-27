"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModulesProviderAsync = generateModulesProviderAsync;
const platforms_1 = require("../platforms");
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