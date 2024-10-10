"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeSourceWithReasons = exports.dedupSources = void 0;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const debug = require('debug')('expo:fingerprint:Dedup');
/**
 * Strip duplicated sources, mainly for duplicated file or dir
 */
function dedupSources(sources, projectRoot) {
    const newSources = [];
    for (const source of sources) {
        const [duplicatedItemIndex, shouldSwapSource] = findDuplicatedSourceIndex(newSources, source, projectRoot);
        if (duplicatedItemIndex >= 0) {
            const duplicatedItem = newSources[duplicatedItemIndex];
            debug(`Skipping duplicated source: ${JSON.stringify(source)}`);
            if (shouldSwapSource) {
                newSources[duplicatedItemIndex] = {
                    ...source,
                    reasons: [...source.reasons, ...duplicatedItem.reasons],
                };
            }
            else {
                duplicatedItem.reasons = [...duplicatedItem.reasons, ...source.reasons];
            }
        }
        else {
            newSources.push(source);
        }
    }
    return newSources;
}
exports.dedupSources = dedupSources;
/**
 * When two sources are duplicated, merge `src`'s reasons into `dst`
 */
function mergeSourceWithReasons(dst, src) {
    return dst;
}
exports.mergeSourceWithReasons = mergeSourceWithReasons;
/**
 * Find the duplicated `source` in `newSources`
 * @return tuple of [duplicatedItemIndexInNewSources, shouldSwapSource]
 */
function findDuplicatedSourceIndex(newSources, source, projectRoot) {
    let shouldSwapSource = false;
    if (source.type === 'contents') {
        return [
            newSources.findIndex((item) => item.type === source.type && item.id === source.id) ?? null,
            shouldSwapSource,
        ];
    }
    for (const [index, existingSource] of newSources.entries()) {
        if (existingSource.type === 'contents') {
            continue;
        }
        if (isDescendant(source, existingSource, projectRoot)) {
            return [index, shouldSwapSource];
        }
        // If the new source is ancestor of existing source, replace swap the existing source with the new source
        if (isDescendant(existingSource, source, projectRoot)) {
            shouldSwapSource = true;
            return [index, shouldSwapSource];
        }
    }
    return [-1, shouldSwapSource];
}
function isDescendant(from, to, projectRoot) {
    if (from === to) {
        return true;
    }
    const fromPath = path_1.default.join(projectRoot, from.filePath);
    const toPath = path_1.default.join(projectRoot, to.filePath);
    const result = path_1.default.relative(fromPath, toPath).match(/^[./\\/]*$/) != null;
    if (result) {
        (0, assert_1.default)(!(to.type === 'file' && from.type === 'dir'), `Unexpected case which a dir is a descendant of a file - from[${fromPath}] to[${toPath}]`);
    }
    return result;
}
//# sourceMappingURL=Dedup.js.map