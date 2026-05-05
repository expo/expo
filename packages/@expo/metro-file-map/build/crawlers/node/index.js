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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nodeCrawl;
const child_process_1 = require("child_process");
const fs = __importStar(require("graceful-fs"));
const os_1 = require("os");
const path = __importStar(require("path"));
const hasNativeFindSupport_1 = __importDefault(require("./hasNativeFindSupport"));
const RootPathUtils_1 = require("../../lib/RootPathUtils");
const debug = require('debug')('Metro:NodeCrawler');
function find(roots, extensions, ignore, includeSymlinks, rootDir, console, callback) {
    const result = new Map();
    let activeCalls = 0;
    const pathUtils = new RootPathUtils_1.RootPathUtils(rootDir);
    function search(directory) {
        activeCalls++;
        fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
            activeCalls--;
            if (err) {
                console.warn(`Error "${err.code ?? err.message}" reading contents of "${directory}", skipping. Add this directory to your ignore list to exclude it.`);
            }
            else {
                entries.forEach((entry) => {
                    const file = path.join(directory, entry.name.toString());
                    if (ignore(file)) {
                        return;
                    }
                    if (entry.isSymbolicLink() && !includeSymlinks) {
                        return;
                    }
                    if (entry.isDirectory()) {
                        search(file);
                        return;
                    }
                    activeCalls++;
                    fs.lstat(file, (err, stat) => {
                        activeCalls--;
                        if (!err && stat) {
                            const ext = path.extname(file).substr(1);
                            if (stat.isSymbolicLink() || extensions.includes(ext)) {
                                result.set(pathUtils.absoluteToNormal(file), [
                                    stat.mtime.getTime(),
                                    stat.size,
                                    0,
                                    null,
                                    stat.isSymbolicLink() ? 1 : 0,
                                    null,
                                ]);
                            }
                        }
                        if (activeCalls === 0) {
                            callback(result);
                        }
                    });
                });
            }
            if (activeCalls === 0) {
                callback(result);
            }
        });
    }
    if (roots.length > 0) {
        roots.forEach(search);
    }
    else {
        callback(result);
    }
}
function findNative(roots, extensions, ignore, includeSymlinks, rootDir, console, callback) {
    // Examples:
    // ( ( -type f ( -iname *.js ) ) )
    // ( ( -type f ( -iname *.js -o -iname *.ts ) ) )
    // ( ( -type f ( -iname *.js ) ) -o -type l )
    // ( ( -type f ) -o -type l )
    const extensionClause = extensions.length
        ? `( ${extensions.map((ext) => `-iname *.${ext}`).join(' -o ')} )`
        : ''; // Empty inner expressions eg "( )" are not allowed
    const expression = `( ( -type f ${extensionClause} ) ${includeSymlinks ? '-o -type l ' : ''})`;
    const pathUtils = new RootPathUtils_1.RootPathUtils(rootDir);
    const child = (0, child_process_1.spawn)('find', [...roots, ...expression.split(' ')]);
    let stdout = '';
    if (child.stdout == null) {
        throw new Error('stdout is null - this should never happen. Please open up an issue at https://github.com/facebook/metro');
    }
    child.stdout.setEncoding('utf-8');
    child.stdout.on('data', (data) => (stdout += data));
    child.stdout.on('close', () => {
        const lines = stdout
            .trim()
            .split('\n')
            .filter((x) => !ignore(x));
        const result = new Map();
        let count = lines.length;
        if (!count) {
            callback(new Map());
        }
        else {
            lines.forEach((filePath) => {
                fs.lstat(filePath, (err, stat) => {
                    if (!err && stat) {
                        result.set(pathUtils.absoluteToNormal(filePath), [
                            stat.mtime.getTime(),
                            stat.size,
                            0,
                            null,
                            stat.isSymbolicLink() ? 1 : 0,
                            null,
                        ]);
                    }
                    if (--count === 0) {
                        callback(result);
                    }
                });
            });
        }
    });
}
async function nodeCrawl(options) {
    const { console, previousState, extensions, forceNodeFilesystemAPI, ignore, rootDir, includeSymlinks, perfLogger, roots, abortSignal, subpath, } = options;
    abortSignal?.throwIfAborted();
    perfLogger?.point('nodeCrawl_start');
    const useNativeFind = !forceNodeFilesystemAPI && (0, os_1.platform)() !== 'win32' && (await (0, hasNativeFindSupport_1.default)());
    debug('Using system find: %s', useNativeFind);
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
        if (useNativeFind) {
            findNative(roots, extensions, ignore, includeSymlinks, rootDir, console, callback);
        }
        else {
            find(roots, extensions, ignore, includeSymlinks, rootDir, console, callback);
        }
    });
}
