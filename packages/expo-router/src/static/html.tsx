/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { type PropsWithChildren } from 'react';

// TODO(@hassankhan): Add this to global types
declare global {
  interface Window {
    /**
     * Data injected by the Expo Router loader for the current route.
     */
    __EXPO_ROUTER_LOADER_DATA__?: Record<string, any>;
  }
}

/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
export function ScrollViewStyleReset() {
  return (
    <style
      id="expo-reset"
      dangerouslySetInnerHTML={{
        __html: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`,
      }}
    />
  );
}

/**
 * Injects loader data into the HTML as a script tag for client-side hydration.
 * The data is serialized as JSON and made available on window.__EXPO_ROUTER_LOADER_DATA__.
 */
export function LoaderDataScript({ data }: { data: Record<string, unknown> }) {
  const safeJson = escapeUnsafeCharacters(JSON.stringify(data));

  return (
    <script
      type="module"
      data-testid="loader-script"
      dangerouslySetInnerHTML={{
        __html: `window.__EXPO_ROUTER_LOADER_DATA__ = ${safeJson};`,
      }}
    />
  );
}

export function Html({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

// @see https://github.com/yahoo/serialize-javascript/blob/79ac5da98ecdb5fbc20912a2d3ba5cd34949e0e9/index.js#L19
// eslint-disable-next-line no-useless-escape
const UNSAFE_CHARACTERS_REGEXP = /[<>\/\u2028\u2029]/g;
// @see https://github.com/yahoo/serialize-javascript/blob/79ac5da98ecdb5fbc20912a2d3ba5cd34949e0e9/index.js#L25-L31
const ESCAPED_CHARACTERS = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Replaces unsafe characters in a string with their escaped equivalents. This is to safely
 * embed data in an HTML context to prevent XSS.
 */
function escapeUnsafeCharacters(str: string): string {
  return str.replace(UNSAFE_CHARACTERS_REGEXP, (unsafeChar) => {
    return ESCAPED_CHARACTERS[unsafeChar as keyof typeof ESCAPED_CHARACTERS];
  });
}
