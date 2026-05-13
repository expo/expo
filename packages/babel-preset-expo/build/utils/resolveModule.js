"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModule = resolveModule;
exports.hasModule = hasModule;
const common_1 = require("../common");
let _prevPossibleProjectRoot = null;
let _cache = Object.create(null);
function resolveModule(api, id) {
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot) ?? process.cwd();
    if (possibleProjectRoot !== _prevPossibleProjectRoot) {
        _prevPossibleProjectRoot = possibleProjectRoot;
        _cache = Object.create(null);
    }
    let resolved = _cache[id];
    if (resolved !== undefined) {
        return resolved;
    }
    try {
        resolved = require.resolve(id, {
            paths: [possibleProjectRoot, __dirname],
        });
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(id)) {
            resolved = null;
        }
        else {
            throw error;
        }
    }
    finally {
        _cache[id] = resolved;
    }
    return resolved;
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
//# sourceMappingURL=resolveModule.js.map