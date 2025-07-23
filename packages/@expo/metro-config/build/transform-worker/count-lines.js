"use strict";
/**
 * Copyright 2024-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/facebook/metro/blob/96c6b893eb77b5929b6050d7189905232ddf6d6d/packages/metro-transform-worker/src/index.js#L679
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.countLinesAndTerminateMap = countLinesAndTerminateMap;
function countLinesAndTerminateMap(code, map) {
    const NEWLINE = /\r\n?|\n|\u2028|\u2029/g;
    let lineCount = 1;
    let lastLineStart = 0;
    // Count lines and keep track of where the last line starts
    for (const match of code.matchAll(NEWLINE)) {
        if (match.index == null)
            continue;
        lineCount++;
        lastLineStart = match.index + match[0].length;
    }
    const lastLineLength = code.length - lastLineStart;
    const lastLineIndex1Based = lineCount;
    const lastLineNextColumn0Based = lastLineLength;
    // If there isn't a mapping at one-past-the-last column of the last line,
    // add one that maps to nothing. This ensures out-of-bounds lookups hit the
    // null mapping rather than aliasing to whichever mapping happens to be last.
    // ASSUMPTION: Mappings are generated in order of increasing line and column.
    const lastMapping = map[map.length - 1];
    const terminatingMapping = [lastLineIndex1Based, lastLineNextColumn0Based];
    if (!lastMapping ||
        lastMapping[0] !== terminatingMapping[0] ||
        lastMapping[1] !== terminatingMapping[1]) {
        return {
            lineCount,
            map: map.concat([terminatingMapping]),
        };
    }
    return { lineCount, map: [...map] };
}
//# sourceMappingURL=count-lines.js.map