"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUncachedFile = exports.tryRequireThenImport = void 0;
const path = __importStar(require("node:path"));
const url = __importStar(require("node:url"));
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
            const moduleIdOrUrl = path.isAbsolute(moduleId) ? url.pathToFileURL(moduleId).href : moduleId;
            const m = await importESM(moduleIdOrUrl);
            return m.default ?? m;
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