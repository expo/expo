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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryRequireThenImport = tryRequireThenImport;
exports.requireUncachedFile = requireUncachedFile;
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
//# sourceMappingURL=require.js.map