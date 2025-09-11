/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { type PropsWithChildren } from 'react';

import { escapeUnsafeCharacters } from '../utils/html';

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
 * The data is serialized as JSON and made available on the `globalThis.__EXPO_ROUTER_LOADER_DATA__` global.
 */
export function PreloadedDataScript({ data }: { data: Record<string, unknown> }) {
  const safeJson = escapeUnsafeCharacters(JSON.stringify(data));

  return (
    <script
      id="expo-router-data"
      type="module"
      dangerouslySetInnerHTML={{
        // NOTE(@hassankhan): The double serialization used here isn't as much of a problem server-side, but allows faster
        // client-side parsing using native `JSON.parse()`. See https://v8.dev/blog/cost-of-javascript-2019#json
        __html: `globalThis.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse(${JSON.stringify(safeJson)});`,
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
