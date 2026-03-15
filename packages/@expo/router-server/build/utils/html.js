"use strict";
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeUnsafeCharacters = escapeUnsafeCharacters;
exports.createInjectedCssElements = createInjectedCssElements;
exports.createInjectedScriptElements = createInjectedScriptElements;
exports.getHydrationFlagScript = getHydrationFlagScript;
exports.serializeHelmetToHtml = serializeHelmetToHtml;
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
/**
 * Returns a newline-separated `<link rel="preload">` and `<link rel="stylesheet">` pair for each
 * CSS href.
 *
 * Used by both `renderStaticContent()` and `serializeHtml()` to inject CSS bundles into the HTML
 * document's `<body>` element.
 */
function createInjectedCssElements(hrefs) {
    return hrefs
        .flatMap((href) => [
        `<link rel="preload" href="${href}" as="style">`,
        `<link rel="stylesheet" href="${href}">`,
    ])
        .join('\n');
}
/**
 * Returns newline-separated `<script defer>` HTML strings for each JavaScript source URL.
 *
 * Used by both `renderStaticContent()` and `serializeHtml()` to inject JavaScript bundles into the
 * HTML document's `<body>` element.
 */
function createInjectedScriptElements(srcs) {
    return srcs.map((src) => `<script src="${src}" defer></script>`).join('\n');
}
/**
 * Returns a module script that sets the `__EXPO_ROUTER_HYDRATE__` global flag, which tells the
 * client-side Expo Router entrypoint to hydrate the server-rendered markup instead of performing
 * a full client render.
 *
 * @see packages/expo/src/launch/registerRootComponent.tsx
 */
function getHydrationFlagScript() {
    return `<script type="module">globalThis.__EXPO_ROUTER_HYDRATE__=true;</script>`;
}
const HELMET_HEAD_KEYS = ['title', 'priority', 'meta', 'link', 'script', 'style'];
/**
 * Extracts head tags and document attributes from a `react-helmet-async` helmet instance.
 *
 * `<head>` keys are serialized in document order: title, priority, meta, link, script, style.
 * Returns empty strings when `helmet` is `null`/`undefined`.
 */
function serializeHelmetToHtml(helmet) {
    if (!helmet) {
        return { headTags: '', htmlAttributes: '', bodyAttributes: '' };
    }
    const headParts = [];
    for (const key of HELMET_HEAD_KEYS) {
        const result = helmet[key]?.toString();
        if (result) {
            headParts.push(result);
        }
    }
    return {
        headTags: headParts.join(''),
        htmlAttributes: helmet.htmlAttributes?.toString() ?? '',
        bodyAttributes: helmet.bodyAttributes?.toString() ?? '',
    };
}
//# sourceMappingURL=html.js.map