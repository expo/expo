"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDangerousMod = void 0;
const withMod_1 = require("./withMod");
/**
 * Mods that don't modify any data, all unresolved functionality is performed inside a dangerous mod.
 * All dangerous mods run first before other mods.
 *
 * @param config
 * @param platform
 * @param action
 */
const withDangerousMod = (config, [platform, action]) => {
    return (0, withMod_1.withMod)(config, {
        platform,
        mod: 'dangerous',
        action,
    });
};
exports.withDangerousMod = withDangerousMod;
