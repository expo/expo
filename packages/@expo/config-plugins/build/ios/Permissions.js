"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPermissionsPlugin = exports.applyPermissions = void 0;
const debug_1 = __importDefault(require("debug"));
const ios_plugins_1 = require("../plugins/ios-plugins");
const debug = (0, debug_1.default)('expo:config-plugins:ios:permissions');
function applyPermissions(defaults, permissions, infoPlist) {
    const entries = Object.entries(defaults);
    if (entries.length === 0) {
        debug(`No defaults provided: ${JSON.stringify(permissions)}`);
    }
    for (const [permission, description] of entries) {
        if (permissions[permission] === false) {
            debug(`Deleting "${permission}"`);
            delete infoPlist[permission];
        }
        else {
            infoPlist[permission] = permissions[permission] || infoPlist[permission] || description;
            debug(`Setting "${permission}" to "${infoPlist[permission]}"`);
        }
    }
    return infoPlist;
}
exports.applyPermissions = applyPermissions;
/**
 * Helper method for creating mods to apply default permissions.
 *
 * @param action
 */
function createPermissionsPlugin(defaults, name) {
    const withIosPermissions = (config, permissions) => (0, ios_plugins_1.withInfoPlist)(config, async (config) => {
        config.modResults = applyPermissions(defaults, permissions, config.modResults);
        return config;
    });
    if (name) {
        Object.defineProperty(withIosPermissions, 'name', {
            value: name,
        });
    }
    return withIosPermissions;
}
exports.createPermissionsPlugin = createPermissionsPlugin;
