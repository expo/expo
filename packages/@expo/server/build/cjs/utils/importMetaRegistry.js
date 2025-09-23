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
exports.importMetaRegistry = void 0;
const node_util = __importStar(require("node:util"));
const DEFAULT_SCRIPT_NAME = 'file:///__main.js';
// - ./runtime/importMetaRegistry.ts (this file) -> importMetaRegistry.url
// - ./runtime/index.ts -> globalThis.__ExpoImportMetaRegistry
// - <source>
const CALL_DEPTH = 3;
function getFileName(offset = 0) {
    const originalStackFormatter = Error.prepareStackTrace;
    const originalStackTraceLimit = Error.stackTraceLimit;
    try {
        Error.stackTraceLimit = offset;
        Error.prepareStackTrace = (_err, stack) => stack[offset - 1]?.getFileName();
        return new Error().stack;
    }
    finally {
        Error.prepareStackTrace = originalStackFormatter;
        Error.stackTraceLimit = originalStackTraceLimit;
    }
}
exports.importMetaRegistry = {
    get url() {
        let scriptName;
        if (node_util.getCallSites) {
            const callSites = node_util.getCallSites(CALL_DEPTH);
            scriptName = callSites[callSites.length - 1]?.scriptName;
        }
        else {
            scriptName = getFileName(CALL_DEPTH);
        }
        if (scriptName?.[0] === '/')
            scriptName = `file://${scriptName}`;
        return scriptName || DEFAULT_SCRIPT_NAME;
    },
};
//# sourceMappingURL=importMetaRegistry.js.map