"use strict";
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeUnsafeCharacters = escapeUnsafeCharacters;
// See: https://github.com/urql-graphql/urql/blob/ad0276ae616b2b2f2cd01a527b4217ae35c3fa2d/packages/next-urql/src/htmlescape.ts#L10
// License: https://github.com/urql-graphql/urql/blob/ad0276ae616b2b2f2cd01a527b4217ae35c3fa2d/LICENSE
// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE
const UNSAFE_CHARACTERS_REGEX = /[&><\u2028\u2029]/g;
const ESCAPED_CHARACTERS = {
    '&': '\\u0026',
    '>': '\\u003e',
    '<': '\\u003c',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
};
/**
 * Replaces unsafe characters in a string with their escaped equivalents. This is to safely
 * embed data in an HTML context to prevent XSS.
 */
function escapeUnsafeCharacters(str) {
    return str.replace(UNSAFE_CHARACTERS_REGEX, (match) => ESCAPED_CHARACTERS[match]);
}
//# sourceMappingURL=html.js.map