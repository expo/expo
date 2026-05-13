"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFallbackDir = isFallbackDir;
exports.default = createFallbackFilesystem;
exports.shouldFallbackCrawlDir = shouldFallbackCrawlDir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const normalizePathSeparatorsToPosix_1 = __importDefault(require("../../lib/normalizePathSeparatorsToPosix"));
const FALLBACK_DIR = Symbol.for('fallbackDir');
var FallbackFlag;
(function (FallbackFlag) {
    FallbackFlag[FallbackFlag["VISITED"] = 0] = "VISITED";
    FallbackFlag[FallbackFlag["CRAWLED"] = 1] = "CRAWLED";
})(FallbackFlag || (FallbackFlag = {}));
function markDir(dirNode, flag) {
    dirNode[FALLBACK_DIR] = flag;
}
function getDirFlag(dirNode) {
    return dirNode[FALLBACK_DIR];
}
/**
 * Whether a directory node was created or populated by the fallback filesystem.
 * Used by TreeFS to determine if a directory outside the fallback boundary was
 * reached legitimately (e.g., via symlink traversal) and should allow further
 * fallback lookups.
 */
function isFallbackDir(dirNode) {
    return dirNode[FALLBACK_DIR] != null;
}
function isDirectory(node) {
    return node instanceof Map;
}
/**
 * Create a FallbackFilesystem that synchronously queries the real filesystem.
 *
 * - `lookup` uses lstatSync to check a single path (for traversal).
 * - `readdir` uses readdirSync to list directory contents (for enumeration).
 *
 * Both methods apply the same filtering as the node crawler: ignore patterns,
 * extension filtering, and symlink inclusion.
 */
function createFallbackFilesystem(opts) {
    const { rootPathUtils, extensions, ignore, includeSymlinks } = opts;
    const exts = extensions.reduce((acc, ext) => {
        acc[ext] = true;
        return acc;
    }, {});
    function readdir(_normalPath, absolutePath, dirNode) {
        if (dirNode != null && getDirFlag(dirNode) === FallbackFlag.CRAWLED) {
            return dirNode;
        }
        let dirEntries;
        try {
            dirEntries = fs_1.default.readdirSync(absolutePath, { withFileTypes: true });
        }
        catch {
            return null;
        }
        const result = dirNode ?? new Map();
        for (const entry of dirEntries) {
            const name = entry.name.toString();
            const childAbsolutePath = absolutePath + path_1.default.sep + name;
            if (ignore(childAbsolutePath)) {
                continue;
            }
            if (entry.isDirectory()) {
                // NOTE(@kitten): ".git" and ".hg" check replace the VCS_DIRECTORIES ignore pattern
                if (!result.has(name) && name !== '.git' && name !== '.hg') {
                    const childDir = new Map();
                    markDir(childDir, FallbackFlag.VISITED);
                    result.set(name, childDir);
                }
            }
            else if (entry.isSymbolicLink()) {
                // We can skip reading the symlink target here, since it'll be read lazily
                if (includeSymlinks && !result.has(name)) {
                    result.set(name, [null, 0, 0, null, 1, null]);
                }
            }
            else if (entry.isFile()) {
                const ext = path_1.default.extname(name).slice(1);
                if (exts[ext] && !result.has(name)) {
                    result.set(name, [null, 0, 0, null, 0, null]);
                }
            }
        }
        markDir(result, FallbackFlag.CRAWLED);
        return result;
    }
    return {
        readdir,
        lookup(normalPath, absolutePath, prevNode) {
            if (ignore(absolutePath)) {
                return null;
            }
            let stat;
            try {
                stat = fs_1.default.lstatSync(absolutePath);
            }
            catch {
                return null;
            }
            if (stat.isDirectory()) {
                const dirNode = isDirectory(prevNode) ? prevNode : null;
                if (shouldFallbackCrawlDir(absolutePath)) {
                    return readdir(normalPath, absolutePath, dirNode);
                }
                if (dirNode != null) {
                    return dirNode;
                }
                const newDir = new Map();
                markDir(newDir, FallbackFlag.VISITED);
                return newDir;
            }
            else if (stat.isSymbolicLink()) {
                if (!includeSymlinks) {
                    return null;
                }
                try {
                    // We might as well read the symlink target here and assume it'll be used
                    const symlinkTarget = fs_1.default.readlinkSync(absolutePath);
                    // Cached value should be in posix format
                    const target = (0, normalizePathSeparatorsToPosix_1.default)(rootPathUtils.resolveSymlinkToNormal(normalPath, symlinkTarget));
                    return [stat.mtime.getTime(), stat.size, 0, null, target, null];
                }
                catch {
                    return null;
                }
            }
            else if (stat.isFile()) {
                // Check extension — symlinks bypass this check (same as node crawler)
                const ext = path_1.default.extname(absolutePath).slice(1);
                if (!exts[ext]) {
                    return null;
                }
                else {
                    return [stat.mtime.getTime(), stat.size, 0, null, 0, null];
                }
            }
            else {
                return null;
            }
        },
    };
}
// Whether a directory at the given canonical path should be eagerly
// populated via readdir. Returns false for directories that are typically
// too large (node_modules) or not useful (.git, .hg, etc.) to enumerate.
function shouldFallbackCrawlDir(canonicalPath) {
    const lastSepIdx = canonicalPath.lastIndexOf(path_1.default.sep);
    const baseStart = lastSepIdx + 1;
    const baseLen = canonicalPath.length - baseStart;
    if (baseLen === 2 &&
        canonicalPath.charCodeAt(baseStart) === 46 /*'.'*/ &&
        canonicalPath.charCodeAt(baseStart + 1) === 46 /*'.'*/) {
        // '..' is the parent-of-rootDir indirection, not a hidden directory.
        return true;
    }
    else if (canonicalPath.charCodeAt(baseStart) === 46 /*'.'*/) {
        // starts with '.'
        return false;
    }
    else if (baseLen === 12 && canonicalPath.startsWith('node_modules', baseStart)) {
        return false;
    }
    else {
        return true;
    }
}
