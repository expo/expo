/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { normalizeCssAssets, type AssetInfo } from 'expo-server/private';

// See: https://github.com/urql-graphql/urql/blob/ad0276ae616b2b2f2cd01a527b4217ae35c3fa2d/packages/next-urql/src/htmlescape.ts#L10
// License: https://github.com/urql-graphql/urql/blob/ad0276ae616b2b2f2cd01a527b4217ae35c3fa2d/LICENSE

// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE

const UNSAFE_CHARACTERS_REGEX = /[&><\u2028\u2029]/g;
const ESCAPED_CHARACTERS: { [match: string]: string } = {
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
function escapeUnsafeCharacters(str: string): string {
  return str.replace(UNSAFE_CHARACTERS_REGEX, (match) => ESCAPED_CHARACTERS[match] ?? match);
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Returns a newline-separated `<link rel="preload">` and `<link rel="stylesheet">` pair for each
 * CSS href.
 */
function createInjectedCssAsString(hrefs: string[]): string {
  return hrefs
    .flatMap((href) => {
      const safeHref = escapeHtmlAttribute(href);
      return [
        `<link rel="preload" href="${safeHref}" as="style">`,
        `<link rel="stylesheet" href="${safeHref}">`,
      ];
    })
    .join('\n');
}

/**
 * Returns newline-separated `<script defer>` HTML strings for each JavaScript source URL.
 */
function createInjectedScriptsAsString(srcs: string[]): string {
  return srcs.map((src) => `<script src="${escapeHtmlAttribute(src)}" defer></script>`).join('\n');
}

/**
 * Returns a `<link rel="icon" />` HTML string for the given favicon href.
 */
export function createFaviconAsString(href: string): string {
  return `<link rel="icon" href="${escapeHtmlAttribute(href)}"/>`;
}

/**
 * Returns the string content of the hydration flag script, which sets the
 * `__EXPO_ROUTER_HYDRATE__` global flag to `true`.
 *
 * @see {@link getHydrationFlagScriptAsString} for the full `<script>` tag wrapper.
 */
export function getHydrationFlagScriptContents(): string {
  return `globalThis.__EXPO_ROUTER_HYDRATE__=true;`;
}

/**
 * Returns a module script that sets the `__EXPO_ROUTER_HYDRATE__` global flag, which tells the
 * client-side Expo Router entrypoint to hydrate the server-rendered markup instead of performing
 * a full client render.
 *
 * @see packages/expo/src/launch/registerRootComponent.tsx
 */
function getHydrationFlagScriptAsString(): string {
  return `<script type="module">${getHydrationFlagScriptContents()}</script>`;
}

/**
 * Returns the string content of the loader data script, which sets
 * `globalThis.__EXPO_ROUTER_LOADER_DATA__` to the given data using double-serialized JSON.
 *
 * Uses double-serialization so the client can fast-parse via native `JSON.parse()`.
 * @see https://v8.dev/blog/cost-of-javascript-2019#json
 */
export function getLoaderDataScriptContents(data: Record<string, unknown>): string {
  const safeJson = escapeUnsafeCharacters(JSON.stringify(data));
  return `globalThis.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse(${JSON.stringify(safeJson)});`;
}

function createExternalCssLinkAsString({ href, media }: { href: string; media?: string }): string {
  let link = `<link rel="stylesheet" href="${escapeHtmlAttribute(href)}"`;
  if (media) {
    link += ` media="${escapeHtmlAttribute(media)}"`;
  }
  return link + '>';
}

/**
 * Injects favicon, hydration flag, and CSS (in that order) before `</head>`, and deferred scripts
 * before `</body>`.
 */
export function injectAssetsIntoHtml(
  html: string,
  { assets, hydrate }: { assets?: AssetInfo; hydrate?: boolean }
): string {
  if (assets?.favicon) {
    html = html.replace('</head>', `${createFaviconAsString(assets.favicon)}</head>`);
  }

  if (hydrate) {
    html = html.replace('</head>', `${getHydrationFlagScriptAsString()}</head>`);
  }

  if (assets) {
    const styleString = normalizeCssAssets(assets)
      .map((entry) => {
        switch (entry.type) {
          case 'css':
            return createInjectedCssAsString([entry.href]);
          case 'inline': {
            const hmrAttribute =
              entry.hmrId === undefined
                ? ''
                : ` data-expo-css-hmr="${escapeHtmlAttribute(entry.hmrId)}"`;
            return `<style${hmrAttribute}>${entry.source}\n</style>`;
          }
          case 'external':
            return createExternalCssLinkAsString(entry);
        }
      })
      .join('');
    if (styleString) {
      html = html.replace('</head>', `${styleString}</head>`);
    }

    const scripts = assets.js.map((src) => createInjectedScriptsAsString([src])).join('');
    if (scripts) {
      html = html.replace('</body>', `${scripts}\n</body>`);
    }
  }

  return html;
}
