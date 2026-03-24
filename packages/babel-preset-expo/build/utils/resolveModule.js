"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModule = resolveModule;
exports.hasModule = hasModule;
const common_1 = require("../common");
function resolveModule(api, id) {
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot) ?? process.cwd();
    try {
        return require.resolve(id, {
            paths: [possibleProjectRoot, __dirname],
        });
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(id)) {
            return null;
        }
        throw error;
    }
}
function hasModule(api, id) {
    try {
        return resolveModule(api, id) != null;
    }
    catch {
        // We should always fail silently for a "hasModule" check
        return false;
    }
}
