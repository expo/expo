/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Replaces unsafe characters in a string with their escaped equivalents. This is to safely
 * embed data in an HTML context to prevent XSS.
 */
export declare function escapeUnsafeCharacters(str: string): string;
/**
 * Returns a newline-separated `<link rel="preload">` and `<link rel="stylesheet">` pair for each
 * CSS href.
 *
 * Used by both `renderStaticContent()` and `serializeHtml()` to inject CSS bundles into the HTML
 * document's `<body>` element.
 */
export declare function createInjectedCssElements(hrefs: string[]): string;
/**
 * Returns newline-separated `<script defer>` HTML strings for each JavaScript source URL.
 *
 * Used by both `renderStaticContent()` and `serializeHtml()` to inject JavaScript bundles into the
 * HTML document's `<body>` element.
 */
export declare function createInjectedScriptElements(srcs: string[]): string;
/**
 * Returns a module script that sets the `__EXPO_ROUTER_HYDRATE__` global flag, which tells the
 * client-side Expo Router entrypoint to hydrate the server-rendered markup instead of performing
 * a full client render.
 *
 * @see packages/expo/src/launch/registerRootComponent.tsx
 */
export declare function getHydrationFlagScript(): string;
/**
 * Extracts head tags and document attributes from a `react-helmet-async` helmet instance.
 *
 * `<head>` keys are serialized in document order: title, priority, meta, link, script, style.
 * Returns empty strings when `helmet` is `null`/`undefined`.
 */
export declare function serializeHelmetToHtml(helmet: any): {
    headTags: string;
    htmlAttributes: string;
    bodyAttributes: string;
};
//# sourceMappingURL=html.d.ts.map