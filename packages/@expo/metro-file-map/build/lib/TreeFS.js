"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const invariant_1 = __importDefault(require("invariant"));
const path_1 = __importDefault(require("path"));
const constants_1 = __importDefault(require("../constants"));
const normalizePathSeparatorsToPosix_1 = __importDefault(require("./normalizePathSeparatorsToPosix"));
const normalizePathSeparatorsToSystem_1 = __importDefault(require("./normalizePathSeparatorsToSystem"));
const fallback_1 = require("../crawlers/node/fallback");
const RootPathUtils_1 = require("./RootPathUtils");
function isDirectory(node) {
    return node instanceof Map;
}
function isRegularFile(node) {
    return node != null && node[constants_1.default.SYMLINK] === 0;
}
/**
 * OVERVIEW:
 *
 * TreeFS is Metro's in-memory representation of the file system. It is
 * structured as a tree of non-empty maps and leaves (tuples), with the root
 * node representing the given `rootDir`, typically Metro's _project root_
 * (not a filesystem root). Map keys are path segments, and branches outside
 * the project root are accessed via `'..'`.
 *
 * EXAMPLE:
 *
 * For a root dir '/data/project', the file '/data/other/app/index.js' would
 * have metadata at #rootNode.get('..').get('other').get('app').get('index.js')
 *
 * SERIALISATION:
 *
 * #rootNode is designed to be directly serialisable and directly portable (for
 * a given project) between different root directories and operating systems.
 *
 * SYMLINKS:
 *
 * Symlinks are represented as nodes whose metadata contains their literal
 * target. Literal targets are resolved to normal paths at runtime, and cached.
 * If a symlink is encountered during traversal, we restart traversal at the
 * root node targeting join(normal symlink target, remaining path suffix).
 *
 * NODE TYPES:
 *
 * - A directory (including a parent directory at '..') is represented by a
 *   `Map` of basenames to any other node type.
 * - A file is represented by an `Array`  (tuple) of metadata, of which:
 *   - A regular file has node[H.SYMLINK] === 0
 *   - A symlink has node[H.SYMLINK] === 1 or
 *     typeof node[H.SYMLINK] === 'string', where a string is the literal
 *     content of the symlink (i.e. from readlink), if known.
 *
 * TERMINOLOGY:
 *
 * - mixedPath
 *   A root-relative or absolute path
 * - relativePath
 *   A root-relative path
 * - normalPath
 *   A root-relative, normalised path (no extraneous '.' or '..'), may have a
 *   single trailing slash
 * - canonicalPath
 *   A root-relative, normalised, real path (no symlinks in dirname), never has
 *   a trailing slash
 */
class TreeFS {
    #fallbackBoundaryDepth;
    #fallbackFilesystem;
    #pathUtils;
    #processFile;
    #rootDir;
    #rootPattern;
    #roots;
    #rootNode = new Map();
    constructor(opts) {
        const { rootDir, files, processFile, fallbackFilesystem, roots, serverRoot } = opts;
        this.#rootDir = rootDir;
        this.#pathUtils = new RootPathUtils_1.RootPathUtils(rootDir);
        this.#processFile = processFile;
        this.#fallbackFilesystem = fallbackFilesystem ?? null;
        if (serverRoot != null) {
            this.#fallbackBoundaryDepth = (0, RootPathUtils_1.getAncestorOfRootIdx)(this.#pathUtils.absoluteToNormal(serverRoot));
        }
        else {
            this.#fallbackBoundaryDepth = null;
        }
        const normalRoots = (roots ?? []).map((r) => this.#pathUtils.absoluteToNormal(r));
        this.#roots = normalRoots;
        this.#rootPattern = (0, RootPathUtils_1.pathsToPattern)(roots ?? [], this.#pathUtils);
        if (files != null) {
            this.bulkAddOrModify(files);
        }
    }
    getSerializableSnapshot() {
        return this.#cloneTree(this.#rootNode);
    }
    static fromDeserializedSnapshot(args) {
        const { rootDir, fileSystemData, processFile, fallbackFilesystem, roots, serverRoot } = args;
        const tfs = new TreeFS({
            processFile,
            rootDir,
            fallbackFilesystem,
            roots,
            serverRoot,
        });
        tfs.#rootNode = fileSystemData;
        return tfs;
    }
    getSize(mixedPath) {
        const fileMetadata = this.#getFileData(mixedPath);
        return (fileMetadata && fileMetadata[constants_1.default.SIZE]) ?? null;
    }
    getDifference(files, options) {
        const changedFiles = new Map(files);
        const removedFiles = new Set();
        const subpath = options?.subpath;
        // If a subpath is specified, start iteration from that node
        let rootNode = this.#rootNode;
        let prefix = '';
        if (subpath != null && subpath !== '') {
            const lookupResult = this.#lookupByNormalPath(subpath, {
                followLeaf: true,
            });
            if (!lookupResult.exists || !isDirectory(lookupResult.node)) {
                // Directory doesn't exist, nothing to compare - all files are new
                return { changedFiles, removedFiles };
            }
            rootNode = lookupResult.node;
            prefix = lookupResult.canonicalPath;
        }
        for (const { canonicalPath, metadata } of this.#metadataIterator(rootNode, {
            includeNodeModules: true,
            includeSymlinks: true,
        }, prefix)) {
            const newMetadata = files.get(canonicalPath);
            if (newMetadata) {
                if (isRegularFile(newMetadata) !== isRegularFile(metadata)) {
                    // Types differ, file has changed
                    continue;
                }
                if (newMetadata[constants_1.default.MTIME] != null &&
                    newMetadata[constants_1.default.MTIME] !== 0 &&
                    newMetadata[constants_1.default.MTIME] === metadata[constants_1.default.MTIME]) {
                    // Types and modified time match - not changed.
                    changedFiles.delete(canonicalPath);
                }
                else if ((newMetadata[constants_1.default.MTIME] == null || newMetadata[constants_1.default.MTIME] === 0) &&
                    (metadata[constants_1.default.MTIME] == null || metadata[constants_1.default.MTIME] === 0)) {
                    // If file is still untouched then mark it as unchanged
                    changedFiles.delete(canonicalPath);
                }
                else if (newMetadata[constants_1.default.SHA1] != null &&
                    newMetadata[constants_1.default.SHA1] === metadata[constants_1.default.SHA1] &&
                    metadata[constants_1.default.VISITED] === 1) {
                    // Content matches - update modified time but don't revisit
                    const updatedMetadata = [...metadata];
                    updatedMetadata[constants_1.default.MTIME] = newMetadata[constants_1.default.MTIME];
                    changedFiles.set(canonicalPath, updatedMetadata);
                }
            }
            else {
                removedFiles.add(canonicalPath);
            }
        }
        return {
            changedFiles,
            removedFiles,
        };
    }
    getMtimeByNormalPath(normalPath) {
        const result = this.#lookupByNormalPath(normalPath, {
            followLeaf: false,
            skipFallback: true,
        });
        return result.exists && !isDirectory(result.node) ? result.node[constants_1.default.MTIME] : null;
    }
    getSha1(mixedPath) {
        const fileMetadata = this.#getFileData(mixedPath);
        return (fileMetadata && fileMetadata[constants_1.default.SHA1]) ?? null;
    }
    async getOrComputeSha1(mixedPath) {
        const normalPath = this.#normalizePath(mixedPath);
        const result = this.#lookupByNormalPath(normalPath, {
            followLeaf: true,
        });
        if (!result.exists || isDirectory(result.node)) {
            return null;
        }
        const { canonicalPath, node: fileMetadata } = result;
        // Populate mtime and size on demand
        if (fileMetadata[constants_1.default.MTIME] == null || fileMetadata[constants_1.default.MTIME] === 0) {
            fileMetadata[constants_1.default.SHA1] = null;
            const absolutePath = this.#pathUtils.normalToAbsolute(canonicalPath);
            try {
                const stat = await fs_1.default.promises.lstat(absolutePath);
                const diskMtime = stat.mtime.getTime();
                fileMetadata[constants_1.default.MTIME] = diskMtime;
                fileMetadata[constants_1.default.SIZE] = stat.size;
            }
            catch { }
        }
        // Empty strings
        const existing = fileMetadata[constants_1.default.SHA1];
        if (existing != null && existing.length > 0) {
            return { sha1: existing };
        }
        // Mutate the metadata we first retrieved. This may be orphaned or about
        // to be overwritten if the file changes while we are processing it -
        // by only mutating the original metadata, we don't risk caching a stale
        // SHA-1 after a change event.
        const maybeContent = await this.#processFile(canonicalPath, fileMetadata, {
            computeSha1: true,
        });
        const sha1 = fileMetadata[constants_1.default.SHA1];
        (0, invariant_1.default)(sha1 != null && sha1.length > 0, "File processing didn't populate a SHA-1 hash for %s", canonicalPath);
        return maybeContent
            ? {
                content: maybeContent,
                sha1,
            }
            : { sha1 };
    }
    exists(mixedPath) {
        const result = this.#getFileData(mixedPath);
        return result != null;
    }
    lookup(mixedPath) {
        const normalPath = this.#normalizePath(mixedPath);
        const links = new Set();
        const result = this.#lookupByNormalPath(normalPath, {
            collectLinkPaths: links,
            followLeaf: true,
        });
        if (!result.exists) {
            const { canonicalMissingPath } = result;
            return {
                exists: false,
                links,
                missing: this.#pathUtils.normalToAbsolute(canonicalMissingPath),
            };
        }
        const { canonicalPath, node } = result;
        const realPath = this.#pathUtils.normalToAbsolute(canonicalPath);
        if (isDirectory(node)) {
            return { exists: true, links, realPath, type: 'd' };
        }
        (0, invariant_1.default)(isRegularFile(node), 'lookup follows symlinks, so should never return one (%s -> %s)', mixedPath, canonicalPath);
        return { exists: true, links, realPath, type: 'f', metadata: node };
    }
    getAllFiles() {
        return Array.from(this.metadataIterator({
            includeNodeModules: true,
            includeSymlinks: false,
        }), ({ canonicalPath }) => this.#pathUtils.normalToAbsolute(canonicalPath));
    }
    linkStats(mixedPath) {
        const fileMetadata = this.#getFileData(mixedPath, { followLeaf: false });
        if (fileMetadata == null) {
            return null;
        }
        const fileType = isRegularFile(fileMetadata) ? 'f' : 'l';
        return {
            fileType,
            modifiedTime: fileMetadata[constants_1.default.MTIME],
            size: fileMetadata[constants_1.default.SIZE],
        };
    }
    /**
     * Given a search context, return a list of file paths matching the query.
     * The query matches against normalized paths which start with `./`,
     * for example: `a/b.js` -> `./a/b.js`
     */
    *matchFiles(opts) {
        const { filter = null, filterCompareAbsolute = false, filterComparePosix = false, follow = false, recursive = true, rootDir = null, } = opts;
        const normalRoot = rootDir == null ? '' : this.#normalizePath(rootDir);
        const contextRootResult = this.#lookupByNormalPath(normalRoot);
        if (!contextRootResult.exists) {
            return;
        }
        const { ancestorOfRootIdx, canonicalPath: rootRealPath, node: contextRoot, parentNode: contextRootParent, } = contextRootResult;
        if (!isDirectory(contextRoot)) {
            return;
        }
        const contextRootAbsolutePath = rootRealPath === '' ? this.#rootDir : path_1.default.join(this.#rootDir, rootRealPath);
        const prefix = filterComparePosix ? './' : '.' + path_1.default.sep;
        const contextRootAbsolutePathForComparison = filterComparePosix && path_1.default.sep !== '/'
            ? contextRootAbsolutePath.replaceAll(path_1.default.sep, '/')
            : contextRootAbsolutePath;
        for (const relativePathForComparison of this.#pathIterator(contextRoot, contextRootParent, ancestorOfRootIdx, {
            alwaysYieldPosix: filterComparePosix,
            canonicalPathOfRoot: rootRealPath,
            follow,
            recursive,
            subtreeOnly: rootDir != null,
        })) {
            if (filter == null ||
                filter.test(
                // NOTE(EvanBacon): Ensure files start with `./` for matching purposes
                // this ensures packages work across Metro and Webpack (ex: Storybook for React DOM / React Native).
                // `a/b.js` -> `./a/b.js`
                filterCompareAbsolute === true
                    ? path_1.default.join(contextRootAbsolutePathForComparison, relativePathForComparison)
                    : prefix + relativePathForComparison)) {
                const relativePath = filterComparePosix === true && path_1.default.sep !== '/'
                    ? relativePathForComparison.replaceAll('/', path_1.default.sep)
                    : relativePathForComparison;
                yield path_1.default.join(contextRootAbsolutePath, relativePath);
            }
        }
    }
    addOrModify(mixedPath, metadata, changeListener) {
        const normalPath = this.#normalizePath(mixedPath);
        // Walk the tree to find the *real* path of the parent node, creating
        // directories as we need.
        const parentDirNode = this.#lookupByNormalPath(path_1.default.dirname(normalPath), {
            changeListener,
            makeDirectories: true,
        });
        if (!parentDirNode.exists) {
            throw new Error(`TreeFS: Failed to make parent directory entry for ${mixedPath}`);
        }
        // Normalize the resulting path to account for the parent node being root.
        const canonicalPath = this.#normalizePath(parentDirNode.canonicalPath + path_1.default.sep + path_1.default.basename(normalPath));
        this.bulkAddOrModify(new Map([[canonicalPath, metadata]]), changeListener);
    }
    bulkAddOrModify(addedOrModifiedFiles, changeListener) {
        // Optimisation: Bulk FileData are typically clustered by directory, so we
        // optimise for that case by remembering the last directory we looked up.
        // Experiments with large result sets show this to be significantly (~30%)
        // faster than caching all lookups in a Map, and 70% faster than no cache.
        let lastDir;
        let directoryNode;
        for (const [normalPath, metadata] of addedOrModifiedFiles) {
            const lastSepIdx = normalPath.lastIndexOf(path_1.default.sep);
            const dirname = lastSepIdx === -1 ? '' : normalPath.slice(0, lastSepIdx);
            const basename = lastSepIdx === -1 ? normalPath : normalPath.slice(lastSepIdx + 1);
            if (directoryNode == null || dirname !== lastDir) {
                const lookup = this.#lookupByNormalPath(dirname, {
                    changeListener,
                    followLeaf: false,
                    makeDirectories: true,
                });
                if (!lookup.exists) {
                    // This should only be possible if the input is non-real and
                    // lookup hits a broken symlink.
                    throw new Error(`TreeFS: Unexpected error adding ${normalPath}.\nMissing: ` +
                        lookup.canonicalMissingPath);
                }
                if (!isDirectory(lookup.node)) {
                    throw new Error(`TreeFS: Could not add directory ${dirname}, adding ${normalPath}. ` +
                        `${dirname} already exists in the file map as a file.`);
                }
                lastDir = dirname;
                directoryNode = lookup.node;
            }
            if (changeListener != null) {
                const existingNode = directoryNode.get(basename);
                if (existingNode != null) {
                    (0, invariant_1.default)(!isDirectory(existingNode), 'Detected addition or modification of file %s, but it is tracked as a non-empty directory', normalPath);
                    // File already exists - this is a modification
                    changeListener.fileModified(normalPath, existingNode, metadata);
                }
                else {
                    // New file
                    changeListener.fileAdded(normalPath, metadata);
                }
            }
            directoryNode.set(basename, metadata);
        }
    }
    remove(mixedPath, changeListener) {
        const normalPath = this.#normalizePath(mixedPath);
        this.#removeNormalPath(normalPath, changeListener);
    }
    #removeNormalPath(normalPath, changeListener) {
        const result = this.#lookupByNormalPath(normalPath, { followLeaf: false });
        if (!result.exists) {
            return;
        }
        const { parentNode, canonicalPath, node } = result;
        if (isDirectory(node) && node.size > 0) {
            for (const basename of node.keys()) {
                this.#removeNormalPath(canonicalPath + path_1.default.sep + basename, changeListener);
            }
            // Removing the last file will delete this directory
            return;
        }
        if (parentNode != null) {
            if (changeListener != null) {
                if (isDirectory(node)) {
                    changeListener.directoryRemoved(canonicalPath);
                }
                else {
                    changeListener.fileRemoved(canonicalPath, node);
                }
            }
            parentNode.delete(path_1.default.basename(canonicalPath));
            if (parentNode.size === 0 && parentNode !== this.#rootNode) {
                // NB: This isn't the most efficient algorithm - in the case of
                // removing the last file in a deep hierarchy it's O(depth^2), but
                // that's not expected to be a case common enough to justify
                // implementation complexity, or slowing down more common uses of
                // _lookupByNormalPath.
                this.#removeNormalPath(path_1.default.dirname(canonicalPath), changeListener);
            }
        }
    }
    /**
     * The core traversal algorithm of TreeFS - takes a normal path and traverses
     * through a tree of maps keyed on path segments, returning the node,
     * canonical path, and other metadata if successful, or the first missing
     * segment otherwise.
     *
     * When a symlink is encountered, we set a new target of the symlink's
     * normalised target path plus the remainder of the original target path. In
     * this way, the eventual target path in a successful lookup has all symlinks
     * resolved, and gives us the real path "for free". Similarly if a traversal
     * fails, we automatically have the real path of the first non-existent node.
     *
     * Note that this code is extremely hot during resolution, being the most
     * expensive part of a file existence check. Benchmark any modifications!
     */
    #lookupByNormalPath(requestedNormalPath, opts = { followLeaf: true, makeDirectories: false }) {
        // We'll update the target if we hit a symlink.
        let targetNormalPath = requestedNormalPath;
        // Lazy-initialised set of seen target paths, to detect symlink cycles.
        let seen;
        // Set when a symlink is followed, to allow fallback population outside
        // the boundary for paths reachable transitively through symlinks.
        let followedSymlink = false;
        // Pointer to the first character of the current path segment in
        // targetNormalPath.
        let fromIdx = opts.start?.pathIdx ?? 0;
        // The parent of the current segment.
        let parentNode = opts.start?.node ?? this.#rootNode;
        // If a returned node is (an ancestor of) the root, this is the number of
        // levels below the root, i.e. '' is 0, '..' is 1, '../..' is 2, otherwise
        // null.
        let ancestorOfRootIdx = opts.start?.ancestorOfRootIdx ?? 0;
        const { collectAncestors, changeListener } = opts;
        // Used only when collecting ancestors, to avoid double-counting nodes and
        // paths when traversing a symlink takes us back to rootNode and out again.
        // This tracks the first character of the first segment not already
        // collected.
        let unseenPathFromIdx = 0;
        while (targetNormalPath.length > fromIdx) {
            const nextSepIdx = targetNormalPath.indexOf(path_1.default.sep, fromIdx);
            const isLastSegment = nextSepIdx === -1;
            const segmentName = isLastSegment
                ? targetNormalPath.slice(fromIdx)
                : targetNormalPath.slice(fromIdx, nextSepIdx);
            const isUnseen = fromIdx >= unseenPathFromIdx;
            fromIdx = !isLastSegment ? nextSepIdx + 1 : targetNormalPath.length;
            if (segmentName === '.') {
                continue;
            }
            let segmentNode = parentNode.get(segmentName);
            // In normal paths all indirections are at the prefix, so we are at the
            // nth ancestor of the root iff the path so far is n '..' segments.
            if (segmentName === '..' && ancestorOfRootIdx != null) {
                ancestorOfRootIdx++;
            }
            else if (segmentNode != null) {
                ancestorOfRootIdx = null;
            }
            if (segmentNode == null) {
                if (opts.makeDirectories !== true && segmentName !== '..') {
                    if (!opts.skipFallback && this.#fallbackFilesystem != null) {
                        const parentEnd = isLastSegment
                            ? fromIdx - segmentName.length - 1
                            : fromIdx - segmentName.length - 2;
                        const parentCanonicalPath = parentEnd > 0 ? targetNormalPath.slice(0, parentEnd) : '';
                        segmentNode = this.#populateFromFilesystem(parentNode, segmentName, parentCanonicalPath, followedSymlink);
                        if (segmentNode != null) {
                            ancestorOfRootIdx = null;
                        }
                    }
                    if (segmentNode == null) {
                        return {
                            canonicalMissingPath: isLastSegment
                                ? targetNormalPath
                                : targetNormalPath.slice(0, fromIdx - 1),
                            exists: false,
                            missingSegmentName: segmentName,
                        };
                    }
                }
                if (segmentNode == null) {
                    segmentNode = new Map();
                    if (opts.makeDirectories === true) {
                        if (changeListener != null) {
                            const canonicalPath = isLastSegment
                                ? targetNormalPath
                                : targetNormalPath.slice(0, fromIdx - 1);
                            changeListener.directoryAdded(canonicalPath);
                        }
                        parentNode.set(segmentName, segmentNode);
                    }
                    else if (!opts.skipFallback && this.#fallbackFilesystem != null) {
                        parentNode.set(segmentName, segmentNode);
                    }
                }
            }
            // We are done if...
            if (
            // ...at a directory node and the only subsequent character is `/`, or
            (nextSepIdx === targetNormalPath.length - 1 && isDirectory(segmentNode)) ||
                // there are no subsequent `/`, and this node is anything but a symlink
                // we're required to resolve due to followLeaf.
                (isLastSegment &&
                    (isDirectory(segmentNode) || isRegularFile(segmentNode) || opts.followLeaf === false))) {
                return {
                    ancestorOfRootIdx,
                    canonicalPath: isLastSegment ? targetNormalPath : targetNormalPath.slice(0, -1), // remove trailing `/`
                    exists: true,
                    node: segmentNode,
                    parentNode,
                };
            }
            // If the next node is a directory, go into it
            if (isDirectory(segmentNode)) {
                parentNode = segmentNode;
                if (collectAncestors && isUnseen) {
                    const currentPath = isLastSegment
                        ? targetNormalPath
                        : targetNormalPath.slice(0, fromIdx - 1);
                    collectAncestors.push({
                        ancestorOfRootIdx,
                        node: segmentNode,
                        normalPath: currentPath,
                        segmentName,
                    });
                }
            }
            else {
                const currentPath = isLastSegment
                    ? targetNormalPath
                    : targetNormalPath.slice(0, fromIdx - 1);
                if (isRegularFile(segmentNode)) {
                    // Regular file in a directory path
                    return {
                        canonicalMissingPath: currentPath,
                        exists: false,
                        missingSegmentName: segmentName,
                    };
                }
                // Symlink in a directory path
                const normalSymlinkTarget = this.#resolveSymlinkTargetToNormalPath(segmentNode, currentPath);
                if (normalSymlinkTarget == null) {
                    return {
                        canonicalMissingPath: currentPath,
                        exists: false,
                        missingSegmentName: segmentName,
                    };
                }
                if (opts.collectLinkPaths) {
                    opts.collectLinkPaths.add(this.#pathUtils.normalToAbsolute(currentPath));
                }
                const remainingTargetPath = isLastSegment ? '' : targetNormalPath.slice(fromIdx);
                // Append any subsequent path segments to the symlink target, and reset
                // with our new target.
                const joinedResult = this.#pathUtils.joinNormalToRelative(normalSymlinkTarget, remainingTargetPath);
                targetNormalPath = joinedResult.normalPath;
                // Two special cases (covered by unit tests):
                //
                // If the symlink target is the root, the root should be a counted as
                // an ancestor. We'd otherwise miss counting it because we normally
                // push new ancestors only when entering a directory.
                //
                // If the symlink target is an ancestor of the root *and* joining it
                // with the remaining path results in collapsing segments, e.g:
                // '../..' + 'parentofroot/root/foo.js' = 'foo.js', then we must add
                // parentofroot and root as ancestors.
                if (collectAncestors &&
                    !isLastSegment &&
                    // No-op optimisation to bail out the common case of nothing to do.
                    ((ancestorOfRootIdx = this.#pathUtils.getAncestorOfRootIdx(normalSymlinkTarget)) === 0 ||
                        joinedResult.collapsedSegments > 0)) {
                    let node = this.#rootNode;
                    let collapsedPath = '';
                    const reverseAncestors = [];
                    for (let i = 0; i <= joinedResult.collapsedSegments && isDirectory(node); i++) {
                        if (
                        // Add the root only if the target is the root or we have
                        // collapsed segments.
                        i > 0 ||
                            ancestorOfRootIdx === 0 ||
                            joinedResult.collapsedSegments > 0) {
                            reverseAncestors.push({
                                ancestorOfRootIdx: i,
                                node,
                                normalPath: collapsedPath,
                                segmentName: this.#pathUtils.getBasenameOfNthAncestor(i),
                            });
                        }
                        node = node.get('..') ?? new Map();
                        collapsedPath = collapsedPath === '' ? '..' : collapsedPath + path_1.default.sep + '..';
                    }
                    collectAncestors.push(...reverseAncestors.reverse());
                }
                // For the purpose of collecting ancestors: Ignore the traversal to
                // the symlink target, and start collecting ancestors only
                // from the target itself (ie, the basename of the normal target path)
                // onwards.
                unseenPathFromIdx = normalSymlinkTarget.lastIndexOf(path_1.default.sep) + 1;
                if (seen == null) {
                    // Optimisation: set this lazily only when we've encountered a symlink
                    seen = new Set([requestedNormalPath]);
                }
                if (seen.has(targetNormalPath)) {
                    // TODO: Warn `Symlink cycle detected: ${[...seen, node].join(' -> ')}`
                    return {
                        canonicalMissingPath: targetNormalPath,
                        exists: false,
                        missingSegmentName: segmentName,
                    };
                }
                seen.add(targetNormalPath);
                followedSymlink = true;
                fromIdx = 0;
                parentNode = this.#rootNode;
                ancestorOfRootIdx = 0;
            }
        }
        (0, invariant_1.default)(parentNode === this.#rootNode, 'Unexpectedly escaped traversal');
        return {
            ancestorOfRootIdx: 0,
            canonicalPath: targetNormalPath,
            exists: true,
            node: this.#rootNode,
            parentNode: null,
        };
    }
    /**
     * Given a start path (which need not exist), a subpath and type, and
     * optionally a 'breakOnSegment', performs the following:
     *
     * X = mixedStartPath
     * do
     *   if basename(X) === opts.breakOnSegment
     *     return null
     *   if X + subpath exists and has type opts.subpathType
     *     return {
     *       absolutePath: realpath(X + subpath)
     *       containerRelativePath: relative(mixedStartPath, X)
     *     }
     *   X = dirname(X)
     * while X !== dirname(X)
     *
     * If opts.invalidatedBy is given, collects all absolute, real paths that if
     * added or removed may invalidate this result.
     *
     * Useful for finding the closest package scope (subpath: package.json,
     * type f, breakOnSegment: node_modules) or closest potential package root
     * (subpath: node_modules/pkg, type: d) in Node.js resolution.
     */
    hierarchicalLookup(mixedStartPath, subpath, opts) {
        const ancestorsOfInput = [];
        const normalPath = this.#normalizePath(mixedStartPath);
        const invalidatedBy = opts.invalidatedBy;
        const closestLookup = this.#lookupByNormalPath(normalPath, {
            collectAncestors: ancestorsOfInput,
            collectLinkPaths: invalidatedBy,
        });
        if (closestLookup.exists && isDirectory(closestLookup.node)) {
            const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(closestLookup.canonicalPath, subpath, opts.subpathType, invalidatedBy, null);
            if (maybeAbsolutePathMatch != null) {
                return {
                    absolutePath: maybeAbsolutePathMatch,
                    containerRelativePath: '',
                };
            }
        }
        else {
            if (invalidatedBy && (!closestLookup.exists || !isDirectory(closestLookup.node))) {
                invalidatedBy.add(this.#pathUtils.normalToAbsolute(closestLookup.exists ? closestLookup.canonicalPath : closestLookup.canonicalMissingPath));
            }
            if (opts.breakOnSegment != null &&
                !closestLookup.exists &&
                closestLookup.missingSegmentName === opts.breakOnSegment) {
                return null;
            }
        }
        // Let the "common root" be the nearest common ancestor of this.rootDir
        // and the input path. We'll look for a match in two stages:
        // 1. Every collected ancestor of the input path, from nearest to furthest,
        //    that is a descendent of the common root
        // 2. The common root, and its ancestors.
        let commonRoot = this.#rootNode;
        let commonRootDepth = 0;
        // Collected ancestors do not include the lookup result itself, so go one
        // further if the input path is itself a root ancestor.
        if (closestLookup.exists && closestLookup.ancestorOfRootIdx != null) {
            commonRootDepth = closestLookup.ancestorOfRootIdx;
            (0, invariant_1.default)(isDirectory(closestLookup.node), 'ancestors of the root must be directories');
            commonRoot = closestLookup.node;
        }
        else {
            // Establish the common root by counting the '..' segments at the start
            // of the collected ancestors.
            for (const ancestor of ancestorsOfInput) {
                if (ancestor.ancestorOfRootIdx == null) {
                    break;
                }
                commonRootDepth = ancestor.ancestorOfRootIdx;
                commonRoot = ancestor.node;
            }
        }
        // Phase 1: Consider descendenants of the common root, from deepest to
        // shallowest.
        for (let candidateIdx = ancestorsOfInput.length - 1; candidateIdx >= commonRootDepth; --candidateIdx) {
            const candidate = ancestorsOfInput[candidateIdx];
            if (candidate.segmentName === opts.breakOnSegment) {
                return null;
            }
            const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(candidate.normalPath, subpath, opts.subpathType, invalidatedBy, {
                ancestorOfRootIdx: candidate.ancestorOfRootIdx,
                node: candidate.node,
                pathIdx: candidate.normalPath.length > 0 ? candidate.normalPath.length + 1 : 0,
            });
            if (maybeAbsolutePathMatch != null) {
                // Determine the input path relative to the current candidate. Note
                // that the candidate path will always be canonical (real), whereas the
                // input may contain symlinks, so the candidate is not necessarily a
                // prefix of the input. Use the fact that each remaining candidate
                // corresponds to a leading segment of the input normal path, and
                // discard the first candidateIdx + 1 segments of the input path.
                //
                // The next 5 lines are equivalent to (but faster than)
                // normalPath.split('/').slice(candidateIdx + 1).join('/').
                let prefixLength = commonRootDepth * 3; // Leading '../'
                for (let i = commonRootDepth; i <= candidateIdx; i++) {
                    prefixLength = normalPath.indexOf(path_1.default.sep, prefixLength + 1);
                }
                const containerRelativePath = normalPath.slice(prefixLength + 1);
                return {
                    absolutePath: maybeAbsolutePathMatch,
                    containerRelativePath,
                };
            }
        }
        // Phase 2: Consider the common root and its ancestors
        // This will be '', '..', '../..', etc.
        let candidateNormalPath = commonRootDepth > 0 ? normalPath.slice(0, 3 * commonRootDepth - 1) : '';
        const remainingNormalPath = normalPath.slice(commonRootDepth * 3);
        let nextNode = commonRoot;
        let depthBelowCommonRoot = 0;
        while (isDirectory(nextNode)) {
            const maybeAbsolutePathMatch = this.#checkCandidateHasSubpath(candidateNormalPath, subpath, opts.subpathType, invalidatedBy, null);
            if (maybeAbsolutePathMatch != null) {
                const rootDirParts = this.#pathUtils.getParts();
                const relativeParts = depthBelowCommonRoot > 0
                    ? rootDirParts.slice(-(depthBelowCommonRoot + commonRootDepth), commonRootDepth > 0 ? -commonRootDepth : undefined)
                    : [];
                if (remainingNormalPath !== '') {
                    relativeParts.push(remainingNormalPath);
                }
                return {
                    absolutePath: maybeAbsolutePathMatch,
                    containerRelativePath: relativeParts.join(path_1.default.sep),
                };
            }
            depthBelowCommonRoot++;
            candidateNormalPath =
                candidateNormalPath === '' ? '..' : candidateNormalPath + path_1.default.sep + '..';
            nextNode = nextNode.get('..');
        }
        return null;
    }
    #checkCandidateHasSubpath(normalCandidatePath, subpath, subpathType, invalidatedBy, start) {
        const lookupResult = this.#lookupByNormalPath(this.#pathUtils.joinNormalToRelative(normalCandidatePath, subpath).normalPath, {
            collectLinkPaths: invalidatedBy,
        });
        if (lookupResult.exists &&
            // Should be a Map iff subpathType is directory
            isDirectory(lookupResult.node) === (subpathType === 'd')) {
            return this.#pathUtils.normalToAbsolute(lookupResult.canonicalPath);
        }
        else if (invalidatedBy) {
            invalidatedBy.add(this.#pathUtils.normalToAbsolute(lookupResult.exists ? lookupResult.canonicalPath : lookupResult.canonicalMissingPath));
        }
        return null;
    }
    metadataIterator(opts) {
        return this.#metadataIterator(this.#rootNode, opts);
    }
    *#metadataIterator(rootNode, opts, prefix = '') {
        for (const [name, node] of rootNode) {
            if (node == null) {
                continue;
            }
            else if (!opts.includeNodeModules && isDirectory(node) && name === 'node_modules') {
                continue;
            }
            const prefixedName = prefix === '' ? name : prefix + path_1.default.sep + name;
            if (isDirectory(node)) {
                yield* this.#metadataIterator(node, opts, prefixedName);
            }
            else if (isRegularFile(node) || opts.includeSymlinks) {
                yield { baseName: name, canonicalPath: prefixedName, metadata: node };
            }
        }
    }
    #normalizePath(relativeOrAbsolutePath) {
        return path_1.default.isAbsolute(relativeOrAbsolutePath)
            ? this.#pathUtils.absoluteToNormal(relativeOrAbsolutePath)
            : this.#pathUtils.relativeToNormal(relativeOrAbsolutePath);
    }
    *#directoryNodeIterator(node, parent, ancestorOfRootIdx) {
        if (ancestorOfRootIdx != null && ancestorOfRootIdx > 0 && parent) {
            yield [this.#pathUtils.getBasenameOfNthAncestor(ancestorOfRootIdx - 1), parent];
        }
        yield* node.entries();
    }
    /**
     * Enumerate paths under a given node, including symlinks and through
     * symlinks (if `follow` is enabled).
     */
    *#pathIterator(iterationRootNode, iterationRootParentNode, ancestorOfRootIdx, opts, pathPrefix = '', followedLinks = new Set()) {
        const pathSep = opts.alwaysYieldPosix ? '/' : path_1.default.sep;
        const prefixWithSep = pathPrefix === '' ? pathPrefix : pathPrefix + pathSep;
        // Optimization: We can attempt to eagerly populate directories we're visiting
        // if they're missing and not accessing a parent ('..')
        if (this.#fallbackFilesystem != null &&
            iterationRootNode.size === 0 &&
            pathPrefix !== '..' &&
            !pathPrefix.endsWith(pathSep + '..')) {
            const canonicalRoot = opts.canonicalPathOfRoot;
            const rootCanonical = pathPrefix === '' ? canonicalRoot : canonicalRoot + path_1.default.sep + pathPrefix;
            this.#populateDirFromFilesystem(iterationRootNode, rootCanonical, false, false);
        }
        for (const [name, node] of this.#directoryNodeIterator(iterationRootNode, iterationRootParentNode, ancestorOfRootIdx)) {
            if (node == null) {
                continue;
            }
            else if (opts.subtreeOnly && name === '..') {
                continue;
            }
            const nodePath = prefixWithSep + name;
            if (!isDirectory(node)) {
                if (isRegularFile(node)) {
                    // regular file
                    yield nodePath;
                }
                else {
                    // symlink
                    const nodePathWithSystemSeparators = pathSep === path_1.default.sep ? nodePath : nodePath.replaceAll(pathSep, path_1.default.sep);
                    // Although both paths are normal, the node path may begin '..' so we
                    // can't simply concatenate.
                    const normalPathOfSymlink = path_1.default.join(opts.canonicalPathOfRoot, nodePathWithSystemSeparators);
                    // We can't resolve the symlink directly here because we only have
                    // its normal path, and we need a canonical path for resolution
                    // (imagine our normal path contains a symlink 'bar' -> '.', and we
                    // are at /foo/bar/baz where baz -> '..' - that should resolve to
                    // /foo, not /foo/bar). We *can* use _lookupByNormalPath to walk to
                    // the canonical symlink, and then to its target.
                    const resolved = this.#lookupByNormalPath(normalPathOfSymlink, {
                        followLeaf: true,
                    });
                    if (!resolved.exists) {
                        // Symlink goes nowhere, nothing to report.
                        continue;
                    }
                    const target = resolved.node;
                    if (!isDirectory(target)) {
                        // Symlink points to a file, just yield the path of the symlink.
                        yield nodePath;
                    }
                    else if (opts.recursive && opts.follow && !followedLinks.has(node)) {
                        // Symlink points to a directory - iterate over its contents using
                        // the path where we found the symlink as a prefix.
                        yield* this.#pathIterator(target, resolved.parentNode, resolved.ancestorOfRootIdx, opts, nodePath, new Set([...followedLinks, node]));
                    }
                }
            }
            else if (opts.recursive) {
                // Optimization: We can attempt to eagerly popuplate directories we're visiting
                // if they're missing and not accessing a parent ('..')
                if (this.#fallbackFilesystem != null && node.size === 0 && name !== '..') {
                    const nodePathWithSystemSeparators = pathSep === path_1.default.sep ? nodePath : nodePath.replaceAll(pathSep, path_1.default.sep);
                    const canonicalPath = opts.canonicalPathOfRoot === ''
                        ? nodePathWithSystemSeparators
                        : opts.canonicalPathOfRoot + path_1.default.sep + nodePathWithSystemSeparators;
                    this.#populateDirFromFilesystem(node, canonicalPath, false, false);
                }
                yield* this.#pathIterator(node, iterationRootParentNode, ancestorOfRootIdx != null && ancestorOfRootIdx > 0 ? ancestorOfRootIdx - 1 : null, opts, nodePath, followedLinks);
            }
        }
    }
    #resolveSymlinkTargetToNormalPath(symlinkNode, canonicalPathOfSymlink) {
        const symlinkTarget = symlinkNode[constants_1.default.SYMLINK];
        if (symlinkTarget === 1) {
            // Symlink target not yet resolved — read it lazily on first traversal
            const absoluteSymlink = this.#pathUtils.normalToAbsolute(canonicalPathOfSymlink);
            try {
                const literalSymlinkTarget = fs_1.default.readlinkSync(absoluteSymlink);
                const normalTarget = this.#pathUtils.resolveSymlinkToNormal(canonicalPathOfSymlink, literalSymlinkTarget);
                symlinkNode[constants_1.default.SYMLINK] = (0, normalizePathSeparatorsToPosix_1.default)(normalTarget);
                symlinkNode[constants_1.default.VISITED] = 1;
                return normalTarget;
            }
            catch {
                return null;
            }
        }
        else if (symlinkTarget === 0 || symlinkTarget == null) {
            // WARN: We shouldn't call this method on non-symlinks. Outside of tests
            // this condition shouldn't trigger. It's fine not to resolve a symlink if
            // it does trigger however
            return null;
        }
        else {
            (0, invariant_1.default)(typeof symlinkTarget === 'string', 'Expected symlink target to be populated.');
            return (0, normalizePathSeparatorsToSystem_1.default)(symlinkTarget);
        }
    }
    #getFileData(filePath, opts = { followLeaf: true }) {
        const normalPath = this.#normalizePath(filePath);
        const result = this.#lookupByNormalPath(normalPath, {
            followLeaf: opts.followLeaf,
        });
        if (!result.exists || isDirectory(result.node)) {
            return null;
        }
        return result.node;
    }
    /**
     * Return a filtered view of the tree containing only content under watched
     * roots. Walk each root path from #rootNode, creating intermediate directory
     * nodes as needed, and reference the subtree at each root endpoint directly.
     * Since roots are non-overlapping, each contributes independently.
     */
    #cloneTree(rootNode) {
        // NOTE(@kitten): The upstream version deeply clones this structure, but this
        // isn't necessary since it's serialized right away by the DiskCacheManager.
        // Even if it isn't, the intention is to store it faithfully, so we're okay
        // with more modifications
        function copyRootInto(normalRoot, source, clone) {
            let currentSource = source;
            let currentClone = clone;
            let fromIdx = 0;
            while (fromIdx < normalRoot.length) {
                const nextSepIdx = normalRoot.indexOf(path_1.default.sep, fromIdx);
                const isLastSegment = nextSepIdx === -1;
                const seg = isLastSegment
                    ? normalRoot.slice(fromIdx)
                    : normalRoot.slice(fromIdx, nextSepIdx);
                fromIdx = isLastSegment ? normalRoot.length : nextSepIdx + 1;
                const sourceChild = currentSource.get(seg);
                if (sourceChild == null || !isDirectory(sourceChild)) {
                    return;
                }
                else if (isLastSegment || fromIdx >= normalRoot.length) {
                    currentClone.set(seg, sourceChild);
                }
                else {
                    let cloneChild = currentClone.get(seg);
                    if (cloneChild == null || !isDirectory(cloneChild)) {
                        cloneChild = new Map();
                        currentClone.set(seg, cloneChild);
                    }
                    currentSource = sourceChild;
                    currentClone = cloneChild;
                }
            }
        }
        if (this.#roots.length === 0) {
            return rootNode;
        }
        const clone = new Map();
        for (const normalRoot of this.#roots) {
            if (normalRoot === '') {
                // Root is rootDir itself — include everything except '..'
                for (const [name, node] of rootNode) {
                    if (node != null && name !== '..') {
                        clone.set(name, node);
                    }
                }
            }
            else {
                copyRootInto(normalRoot, rootNode, clone);
            }
        }
        return clone;
    }
    #isOutsideFallbackBoundary(canonicalPath, dirNode) {
        // We allow any directory that's already been crawled
        if ((0, fallback_1.isFallbackDir)(dirNode)) {
            return false;
        }
        const maxDepth = this.#fallbackBoundaryDepth;
        return maxDepth != null && (0, RootPathUtils_1.getAncestorOfRootIdx)(canonicalPath) > maxDepth;
    }
    /**
     * Synchronously populate a missing tree node by querying the injected
     * fallback filesystem. The fallback returns tree-compatible nodes
     * (FileMetadata tuples or directory Maps) that are inserted directly.
     *
     * Accepts `wasFollowing` to allow traversal on symlinks that were followed.
     * If we're resolving a symlink target, we allow the lookup to escape the
     * fallback scope.
     *
     * Returns the newly created node, or null if the path doesn't exist on disk.
     */
    #populateFromFilesystem(parentNode, segmentName, parentCanonicalPath, wasFollowing) {
        const fallback = this.#fallbackFilesystem;
        if (fallback == null) {
            return null;
        }
        // A symlink traversal (wasFollowing) or a parent created by the fallback
        // (isFallbackDir) lets us skip the boundary check.
        const childCanonicalPath = parentCanonicalPath === '' ? segmentName : parentCanonicalPath + path_1.default.sep + segmentName;
        if (this.#rootPattern?.test(childCanonicalPath + path_1.default.sep) ||
            (!wasFollowing && this.#isOutsideFallbackBoundary(childCanonicalPath, parentNode))) {
            return null;
        }
        else if (parentCanonicalPath !== '' && (0, fallback_1.shouldFallbackCrawlDir)(parentCanonicalPath)) {
            this.#populateDirFromFilesystem(parentNode, parentCanonicalPath, true, wasFollowing);
            return parentNode.get(segmentName) ?? null;
        }
        else if (parentNode.has(segmentName)) {
            return parentNode.get(segmentName) ?? null;
        }
        else {
            const parentAbsolute = this.#pathUtils.normalToAbsolute(parentCanonicalPath);
            const absolutePath = parentAbsolute + path_1.default.sep + segmentName;
            const node = fallback.lookup(childCanonicalPath, absolutePath, parentNode.get(segmentName));
            parentNode.set(segmentName, node);
            return node;
        }
    }
    /**
     * Populate an existing (potentially empty sentinel) directory node from
     * the filesystem. Used by #pathIterator to fill lazy directories before
     * iteration, and by #populateFromFilesystem for optimistic parent
     * population.
     */
    #populateDirFromFilesystem(dirNode, canonicalPath, skipCheck, wasFollowed) {
        const fallback = this.#fallbackFilesystem;
        if (fallback == null ||
            (!skipCheck &&
                (this.#rootPattern?.test(canonicalPath + path_1.default.sep) ||
                    (!wasFollowed && this.#isOutsideFallbackBoundary(canonicalPath, dirNode))))) {
            return;
        }
        const absolutePath = this.#pathUtils.normalToAbsolute(canonicalPath);
        const entries = fallback.readdir(canonicalPath, absolutePath, dirNode);
        if (entries != null && entries !== dirNode) {
            for (const [name, entry] of entries) {
                if (!dirNode.has(name)) {
                    dirNode.set(name, entry);
                }
            }
        }
    }
}
exports.default = TreeFS;
