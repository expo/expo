"use strict";
/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
exports.resolveLoaderModulePath = resolveLoaderModulePath;
const path = __importStar(require("node:path"));
/**
 * Resolves a loader's module path.
 *
 * In development mode: Returns a Metro-compatible relative path
 * In export mode: Returns an absolute filesystem path
 *
 */
function resolveLoaderModulePath(contextKey, options) {
    let modulePath = contextKey.replace(/\.(js|ts)x?$/, '');
    // When exporting, we need an absolute filesystem path for Node.js to `require()`
    if (options.isExporting && options.projectRoot && options.routerRoot) {
        if (modulePath.startsWith('./')) {
            const fileName = modulePath.replace('./', '');
            const appDir = path.join(options.projectRoot, options.routerRoot);
            modulePath = path.resolve(appDir, fileName);
        }
        else if (!path.isAbsolute(modulePath)) {
            const appDir = path.join(options.projectRoot, options.routerRoot);
            modulePath = path.resolve(appDir, modulePath);
        }
    }
    return modulePath;
}
//# sourceMappingURL=resolveLoaderPath.js.map