"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGeneratedHeaderComment = createGeneratedHeaderComment;
exports.createHash = createHash;
exports.mergeContents = mergeContents;
exports.removeContents = removeContents;
exports.removeGeneratedContents = removeGeneratedContents;
function _crypto() {
  const data = _interopRequireDefault(require("crypto"));
  _crypto = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Get line indexes for the generated section of a file.
 *
 * @param src
 */

function getGeneratedSectionIndexes(src, tag) {
  const contents = src.split('\n');
  const start = contents.findIndex(line => new RegExp(`@generated begin ${tag} -`).test(line));
  const end = contents.findIndex(line => new RegExp(`@generated end ${tag}$`).test(line));
  return {
    contents,
    start,
    end
  };
}
/**
 * Merge the contents of two files together and add a generated header.
 *
 * @param src contents of the original file
 * @param newSrc new contents to merge into the original file
 * @param identifier used to update and remove merges
 * @param anchor regex to where the merge should begin
 * @param offset line offset to start merging at (<1 for behind the anchor)
 * @param comment comment style `//` or `#`
 */
function mergeContents({
  src,
  newSrc,
  tag,
  anchor,
  offset,
  comment
}) {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    return {
      contents: addLines(sanitizedTarget ?? src, anchor, offset, [header, ...newSrc.split('\n'), `${comment} @generated end ${tag}`]),
      didMerge: true,
      didClear: !!sanitizedTarget
    };
  }
  return {
    contents: src,
    didClear: false,
    didMerge: false
  };
}
function removeContents({
  src,
  tag
}) {
  // Ensure the old generated contents are removed.
  const sanitizedTarget = removeGeneratedContents(src, tag);
  return {
    contents: sanitizedTarget ?? src,
    didMerge: false,
    didClear: !!sanitizedTarget
  };
}
function addLines(content, find, offset, toAdd) {
  const lines = content.split('\n');
  let lineIndex = lines.findIndex(line => line.match(find));
  if (lineIndex < 0) {
    const error = new Error(`Failed to match "${find}" in contents:\n${content}`);
    // @ts-ignore
    error.code = 'ERR_NO_MATCH';
    throw error;
  }
  for (const newLine of toAdd) {
    lines.splice(lineIndex + offset, 0, newLine);
    lineIndex++;
  }
  return lines.join('\n');
}

/**
 * Removes the generated section from a file, returns null when nothing can be removed.
 * This sways heavily towards not removing lines unless it's certain that modifications were not made manually.
 *
 * @param src
 */
function removeGeneratedContents(src, tag) {
  const {
    contents,
    start,
    end
  } = getGeneratedSectionIndexes(src, tag);
  if (start > -1 && end > -1 && start < end) {
    contents.splice(start, end - start + 1);
    // TODO: We could in theory check that the contents we're removing match the hash used in the header,
    // this would ensure that we don't accidentally remove lines that someone added or removed from the generated section.
    return contents.join('\n');
  }
  return null;
}
function createGeneratedHeaderComment(contents, tag, comment) {
  const hashKey = createHash(contents);

  // Everything after the `${tag} ` is unversioned and can be freely modified without breaking changes.
  return `${comment} @generated begin ${tag} - expo prebuild (DO NOT MODIFY) ${hashKey}`;
}
function createHash(src) {
  // this doesn't need to be secure, the shorter the better.
  const hash = _crypto().default.createHash('sha1').update(src).digest('hex');
  return `sync-${hash}`;
}
//# sourceMappingURL=generateCode.js.map