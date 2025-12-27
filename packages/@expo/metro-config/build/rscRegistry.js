"use strict";
/**
 * RSC Registry
 *
 * Simple registry for RSC client boundaries in dev mode.
 * Maps stable IDs to file paths for module resolution.
 *
 * Stable IDs are relative paths from project root with pnpm normalization:
 * - App files: ./src/Button.tsx
 * - Packages: ./node_modules/pkg/file.js
 */
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
exports.getStableId = getStableId;
exports.recordClientBoundary = recordClientBoundary;
exports.getFilePathByStableId = getFilePathByStableId;
exports.clearRegistry = clearRegistry;
exports.getDiscoveredClientBoundaries = getDiscoveredClientBoundaries;
exports.clearDiscoveredBoundaries = clearDiscoveredBoundaries;
const path = __importStar(require("path"));
// stableId → filePath (for dev mode module resolution)
const clientBoundaries = new Map();
/**
 * Normalize path for cross-platform consistency.
 */
function toPosixPath(filePath) {
    return filePath.replace(/\\/g, '/');
}
/**
 * Generate a stable ID for RSC client/server boundary modules.
 *
 * Uses relative paths from project root, with pnpm symlink normalization.
 * This matches the logic in babel-preset-expo's client-module-proxy-plugin.
 */
function getStableId(filePath, projectRoot) {
    let relativePath = path.relative(projectRoot, filePath);
    // pnpm normalization: .pnpm/pkg@1.0.0/node_modules/pkg/... → pkg/...
    relativePath = relativePath.replace(/node_modules\/\.pnpm\/[^/]+\/node_modules\//g, 'node_modules/');
    return {
        stableId: './' + toPosixPath(relativePath),
        source: 'relative',
    };
}
/**
 * Record a client boundary for dev mode module resolution.
 */
function recordClientBoundary(stableId, filePath) {
    clientBoundaries.set(stableId, filePath);
}
/**
 * Get file path by stable ID (for dev mode module resolution).
 */
function getFilePathByStableId(stableId) {
    return clientBoundaries.get(stableId);
}
/**
 * Clear the registry (for watch mode rebuilds).
 */
function clearRegistry() {
    clientBoundaries.clear();
}
/**
 * Get all discovered client boundaries.
 */
function getDiscoveredClientBoundaries() {
    return new Map(clientBoundaries);
}
/**
 * Clear discovered boundaries.
 */
function clearDiscoveredBoundaries() {
    clientBoundaries.clear();
}
//# sourceMappingURL=rscRegistry.js.map