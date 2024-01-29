"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUncachedFile = exports.tryRequireThenImport = void 0;
async function tryRequireThenImport(moduleId) {
    try {
        return require(moduleId);
    }
    catch (requireError) {
        let importESM;
        try {
            // eslint-disable-next-line no-new-func
            importESM = new Function('id', 'return import(id);');
        }
        catch {
            importESM = null;
        }
        if (requireError?.code === 'ERR_REQUIRE_ESM' && importESM) {
            return (await importESM(moduleId)).default;
        }
        throw requireError;
    }
}
exports.tryRequireThenImport = tryRequireThenImport;
function requireUncachedFile(moduleId) {
    try {
        // delete require.cache[require.resolve(moduleId)];
    }
    catch { }
    try {
        return require(moduleId);
    }
    catch (error) {
        if (error instanceof Error) {
            error.message = `Cannot load file ${moduleId}: ${error.message}`;
        }
        throw error;
    }
}
exports.requireUncachedFile = requireUncachedFile;
//# sourceMappingURL=require.js.map