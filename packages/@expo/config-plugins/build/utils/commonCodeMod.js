"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.insertContentsAtOffset = insertContentsAtOffset;
exports.replaceContentsWithOffset = replaceContentsWithOffset;
exports.searchFromOffset = searchFromOffset;
/**
 * Insert contents at given offset
 * @param srcContents source contents
 * @param insertion content to insert
 * @param offset `srcContents` offset to insert `insertion`
 * @returns updated contents
 */
function insertContentsAtOffset(srcContents, insertion, offset) {
  const srcContentsLength = srcContents.length;
  if (offset < 0 || offset > srcContentsLength) {
    throw new Error('Invalid parameters.');
  }
  if (offset === 0) {
    return `${insertion}${srcContents}`;
  } else if (offset === srcContentsLength) {
    return `${srcContents}${insertion}`;
  }
  const prefix = srcContents.substring(0, offset);
  const suffix = srcContents.substring(offset);
  return `${prefix}${insertion}${suffix}`;
}

/**
 * Replace contents at given start and end offset
 *
 * @param contents source contents
 * @param replacement new contents to place in [startOffset:endOffset]
 * @param startOffset `contents` start offset for replacement
 * @param endOffset `contents` end offset for replacement
 * @returns updated contents
 */
function replaceContentsWithOffset(contents, replacement, startOffset, endOffset) {
  const contentsLength = contents.length;
  if (startOffset < 0 || endOffset < 0 || startOffset >= contentsLength || endOffset >= contentsLength || startOffset > endOffset) {
    throw new Error('Invalid parameters.');
  }
  const prefix = contents.substring(0, startOffset);
  const suffix = contents.substring(endOffset + 1);
  return `${prefix}${replacement}${suffix}`;
}

/**
 * String.prototype.search() with offset support
 *
 * @param source source string to search
 * @param regexp RegExp pattern to search
 * @param offset start offset of `source` to search `regexp` pattern
 * @returns The index of the first match between the regular expression and the given string, or -1 if no match was found.
 */
function searchFromOffset(source, regexp, offset) {
  const target = source.substring(offset);
  const matchedIndex = target.search(regexp);
  return matchedIndex < 0 ? matchedIndex : matchedIndex + offset;
}
//# sourceMappingURL=commonCodeMod.js.map