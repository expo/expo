"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserslistTargets = getBrowserslistTargets;
/**
 * Copyright © 2025 650 Industries.
 */
const browserslistCache = {};
async function getBrowserslistTargets(projectRoot) {
    if (browserslistCache[projectRoot]) {
        return browserslistCache[projectRoot];
    }
    const browserslist = await import('browserslist');
    const { browserslistToTargets } = require('lightningcss');
    const targets = browserslistToTargets(browserslist.default(undefined, {
        throwOnMissing: false,
        ignoreUnknownVersions: true,
        path: projectRoot,
    }));
    browserslistCache[projectRoot] = targets;
    return targets;
}
//# sourceMappingURL=browserslist.js.map