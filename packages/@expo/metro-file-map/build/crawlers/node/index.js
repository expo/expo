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
                    const name = entry.name.toString();
                    const file = directory + path.sep + name;
                    if (ignore(file) || (!includeSymlinks && entry.isSymbolicLink())) {
                        continue;
                    }
                    // Build the normal path incrementally — avoids calling
                    // absoluteToNormal per file.
                    const fileNormal = isWithinRoot
                        ? dirNormal === ''
                            ? name
                            : dirNormal + path.sep + name
                        : pathUtils.absoluteToNormal(file);
                    if (entry.isDirectory()) {
                        search(file, fileNormal, isWithinRoot || fileNormal === '');
                        continue;
                    }
                    const isSymlink = entry.isSymbolicLink();
                    const ext = path.extname(name).slice(1);
                    if (!isSymlink && !exts[ext]) {
                        continue;
                    }
                    const mtime = previousFileSystem?.getMtimeByNormalPath(fileNormal);
                    if (mtime == null || mtime === 0) {
                        // When we're in a cold start or a previous file doesn't exit, we can
                        // skip the mtime/size lstat now and treat the file as new
                        result.set(fileNormal, [null, 0, 0, null, isSymlink ? 1 : 0, null]);
                    }
                    else {
                        activeCalls++;
                        fs.lstat(file, (err, stat) => {
                            activeCalls--;
                            if (!err && stat) {
                                result.set(fileNormal, [
                                    stat.mtime.getTime(),
                                    stat.size,
                                    0,
                                    null,
                                    isSymlink ? 1 : 0,
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
            search(root, rootNormal, !rootNormal.startsWith('..' + path.sep));
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
    const fileData = await new Promise((resolve) => {
        find(roots, extensions, ignore, includeSymlinks, rootDir, console, previousState.fileSystem, resolve);
    });
    perfLogger?.point('nodeCrawl_afterCrawl');
    abortSignal?.throwIfAborted();
    const difference = previousState.fileSystem.getDifference(fileData, {
        subpath,
    });
    perfLogger?.point('nodeCrawl_end');
    return difference;
}
