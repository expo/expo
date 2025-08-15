"use strict";
/**
 * Copyright © 2025 650 Industries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserslistTargets = getBrowserslistTargets;
const debug = require('debug')('expo:metro:browserslist');
const browserslistCache = {};
async function getBrowserslistTargets(projectRoot) {
    if (browserslistCache[projectRoot]) {
        return browserslistCache[projectRoot];
    }
    const browserslist = await import('browserslist');
    const { browserslistToTargets } = await import('lightningcss');
    const targets = browserslistToTargets(browserslist.default(undefined, {
        throwOnMissing: false,
        ignoreUnknownVersions: true,
        path: projectRoot,
    }));
    debug('Browserslist targets: %O', targets);
    browserslistCache[projectRoot] = targets;
    return targets;
}
//# sourceMappingURL=browserslist.js.map