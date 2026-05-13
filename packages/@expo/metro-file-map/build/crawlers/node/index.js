"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
exports.default = nodeCrawl;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const RootPathUtils_1 = require("../../lib/RootPathUtils");
function find(roots, extensions, ignore, includeSymlinks, rootDir, console, previousFileSystem, callback) {
    const result = new Map();
    let activeCalls = 0;
    const pathUtils = new RootPathUtils_1.RootPathUtils(rootDir);
    const exts = extensions.reduce((acc, ext) => {
        acc[ext] = true;
        return acc;
    }, {});
    function search(directory, dirNormal, isWithinRoot) {
        activeCalls++;
        fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
            activeCalls--;
            if (err) {
                console.warn(`Error "${err.code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`);
            }
            else {
                for (let idx = 0; idx < entries.length; idx++) {
                    const entry = entries[idx];
                    const name = entry.name;
                    // NOTE(@kitten): This replaces the VCS_DIRECTORIES ignore pattern
                    const isDirectory = entry.isDirectory();
                    if (isDirectory && (name === '.git' || name === '.hg')) {
                        continue;
                    }
                    const file = directory + path.sep + name;
                    const isSymbolicLink = entry.isSymbolicLink();
                    if (ignore(file) || (!includeSymlinks && isSymbolicLink)) {
                        continue;
                    }
                    // Deriving a normal path above the root dir requires slicing off an up-fragment
                    // then checking if the target matches the next segment of the root dir. It's therefore
                    // easier to fall back to `pathUtils.absoluteToNormal`
                    const childNormal = !isWithinRoot
                        ? pathUtils.absoluteToNormal(file)
                        : dirNormal === ''
                            ? name
                            : dirNormal + path.sep + name;
                    if (isDirectory) {
                        // NOTE(@kitten): We'd like to be able to apply excludes to directories selectively based
                        // on their normal paths, so we can exclude using `^...`
                        if (!ignore(childNormal)) {
                            search(file, childNormal, isWithinRoot || childNormal === '');
                        }
                        continue;
                    }
                    const ext = path.extname(file).substr(1);
                    if (!isSymbolicLink && !exts[ext]) {
                        continue;
                    }
                    const mtime = previousFileSystem?.getMtimeByNormalPath(childNormal);
                    if (mtime == null || mtime === 0) {
                        // When we're in a cold start or a previous file doesn't exist, we can skip
                        // the mtime/size lstat now and treat the file as new
                        result.set(childNormal, [null, 0, 0, null, isSymbolicLink ? 1 : 0, null]);
                    }
                    else {
                        activeCalls++;
                        fs.lstat(file, (err, stat) => {
                            activeCalls--;
                            if (!err && stat) {
                                result.set(childNormal, [
                                    stat.mtime.getTime(),
                                    stat.size,
                                    0,
                                    null,
                                    isSymbolicLink ? 1 : 0,
                                    null,
                                ]);
                            }
                            if (activeCalls === 0) {
                                callback(result);
                            }
                        });
                    }
                }
            }
            if (activeCalls === 0) {
                callback(result);
            }
        });
    }
    if (roots.length > 0) {
        for (const root of roots) {
            const rootNormal = pathUtils.absoluteToNormal(root);
            const isWithinRoot = !rootNormal.startsWith('..' + path.sep);
            search(root, rootNormal, isWithinRoot);
        }
    }
    else {
        callback(result);
    }
}
async function nodeCrawl(options) {
    const { console, previousState, extensions, ignore, rootDir, includeSymlinks, perfLogger, roots, abortSignal, subpath, } = options;
    abortSignal?.throwIfAborted();
    perfLogger?.point('nodeCrawl_start');
    return new Promise((resolve, reject) => {
        const callback = (fileData) => {
            const difference = previousState.fileSystem.getDifference(fileData, {
                subpath,
            });
            perfLogger?.point('nodeCrawl_end');
            try {
                // TODO: Use AbortSignal.reason directly when Flow supports it
                abortSignal?.throwIfAborted();
            }
            catch (e) {
                reject(e);
            }
            resolve(difference);
        };
        find(roots, extensions, ignore, includeSymlinks, rootDir, console, previousState.fileSystem, callback);
    });
}
