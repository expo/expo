"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireUncachedFile = requireUncachedFile;
exports.tryRequireThenImport = tryRequireThenImport;
async function tryRequireThenImport(moduleId) {
  try {
    return require(moduleId);
  } catch (requireError) {
    let importESM;
    try {
      // eslint-disable-next-line no-new-func
      importESM = new Function('id', 'return import(id);');
    } catch {
      importESM = null;
    }
    if ((requireError === null || requireError === void 0 ? void 0 : requireError.code) === 'ERR_REQUIRE_ESM' && importESM) {
      return (await importESM(moduleId)).default;
    }
    throw requireError;
  }
}
function requireUncachedFile(moduleId) {
  try {
    // delete require.cache[require.resolve(moduleId)];
  } catch {}
  try {
    return require(moduleId);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Cannot load file ${moduleId}: ${error.message}`;
    }
    throw error;
  }
}
//# sourceMappingURL=require.js.map