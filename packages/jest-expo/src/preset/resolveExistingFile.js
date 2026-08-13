'use strict';

const fs = require('fs');

/**
 * Resolves a file name taken from a stack frame to a file that exists on disk.
 *
 * Frames raised inside a published package are source-mapped back to the
 * original TypeScript path (e.g. `build/NativeVideoModule.ts`), which is never
 * emitted next to the compiled `build/NativeVideoModule.js`. Reading the frame
 * verbatim therefore misses the file, so fall back to the sibling `.js` the
 * frame was mapped from.
 *
 * Returns `null` when neither path exists.
 */
function resolveExistingFile(fileName) {
  if (!fileName) {
    return null;
  }
  if (fs.existsSync(fileName)) {
    return fileName;
  }
  const compiledFileName = fileName.replace(/\.[cm]?tsx?$/, '.js');
  if (compiledFileName !== fileName && fs.existsSync(compiledFileName)) {
    return compiledFileName;
  }
  return null;
}

module.exports = resolveExistingFile;
