/**
 * Copyright © 2024 650 Industries.
 */

import * as babel from '@babel/core';

import preset, { type BabelPresetExpoOptions } from '..';

const ENABLED_CALLER = {
  name: 'metro',
  isDev: false,
  isServer: false,
  projectRoot: '/',
};

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

function createBabelOptions({
  filename,
  presetOptions,
}: {
  filename?: string;
  presetOptions?: BabelPresetExpoOptions;
}): babel.TransformOptions {
  return {
    // Ensure this is absolute to prevent the filename from being converted to absolute and breaking CI tests.
    filename: filename || '/unknown',

    babelrc: false,
    presets: [[preset, { disableImportExportTransform: true, ...presetOptions }]],
    sourceMaps: true,
    configFile: false,
    compact: false,
    comments: true,
    retainLines: false,
    caller: getCaller({ ...ENABLED_CALLER, platform: 'ios' }),
  };
}

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, FORCE_COLOR: '0' };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

function transformClient({
  sourceCode,
  platform = 'ios',
  isDev = false,
  filename,
  presetOptions,
}: {
  sourceCode: string;
  platform?: string;
  isDev?: boolean;
  filename?: string;
  presetOptions?: BabelPresetExpoOptions;
}) {
  const options = {
    ...createBabelOptions({ filename, presetOptions }),
    caller: getCaller({ ...ENABLED_CALLER, isReactServer: false, platform, isDev }),
  };

  const results = babel.transform(sourceCode, options);
  if (!results) throw new Error('Failed to transform code');

  return {
    code: results.code,
    metadata: results.metadata as unknown as { expoDomComponentReference?: string },
  };
}

const sourceCode = `
"use dom"

export default function App() {
  return <div />
}`;

// Should be identical in development.
['ios', 'android'].forEach((platform) => {
  it(`adds dom components proxy for ${platform} in dev`, () => {
    const res = transformClient({ sourceCode, platform, isDev: true });
    expect(res.metadata.expoDomComponentReference).toBe('file:///unknown');
    expect(res.code).toMatch('react');
    expect(res.code).toMatch('expo/dom/internal');
    expect(res.code).toMatch(/uri: new URL/);
    expect(res.code).toMatch(/"\/_expo\/@dom\/unknown\?/);

    expect(res.code).toMatchInlineSnapshot(`
      "import React from 'react';
      import { WebView } from 'expo/dom/internal';
      var source = {
        uri: new URL("/_expo/@dom/unknown?file=" + "file:///unknown", require("react-native/Libraries/Core/Devtools/getDevServer")().url).toString()
      };
      export default React.forwardRef(function (props, ref) {
        return React.createElement(WebView, Object.assign({
          ref: ref
        }, props, {
          source: source
        }));
      });"
    `);
  });
});

it(`does nothing on web`, () => {
  const res = transformClient({ sourceCode, platform: 'web', isDev: false });
  expect(res.metadata.expoDomComponentReference).toBeUndefined();
  expect(res.code).not.toMatch('expo/dom/internal');
});

it(`adds dom components proxy for ios in production`, () => {
  const res = transformClient({ sourceCode, platform: 'ios', isDev: false });
  expect(res.metadata.expoDomComponentReference).toBe('file:///unknown');
  expect(res.code).toMatch('react');
  expect(res.code).toMatch('expo/dom/internal');
  expect(res.code).toMatch(/www.bundle\/[a-zA-Z0-9]+\.html/);

  expect(res.code).toMatchInlineSnapshot(`
      "import React from 'react';
      import { WebView } from 'expo/dom/internal';
      var source = {
        uri: "www.bundle/98a73bf4a9137dffe9dcb1db68403c36ee5de77a.html"
      };
      export default React.forwardRef(function (props, ref) {
        return React.createElement(WebView, Object.assign({
          ref: ref
        }, props, {
          source: source
        }));
      });"
  `);
});
it(`adds dom components proxy for android in production`, () => {
  const res = transformClient({ sourceCode, platform: 'android', isDev: false });
  expect(res.metadata.expoDomComponentReference).toBe('file:///unknown');
  expect(res.code).toMatch('react');
  expect(res.code).toMatch('expo/dom/internal');
  expect(res.code).toMatch(/www.bundle\/[a-zA-Z0-9]+\.html/);

  expect(res.code).toMatchInlineSnapshot(`
    "import React from 'react';
    import { WebView } from 'expo/dom/internal';
    var source = {
      uri: "file:///android_asset/www.bundle/98a73bf4a9137dffe9dcb1db68403c36ee5de77a.html"
    };
    export default React.forwardRef(function (props, ref) {
      return React.createElement(WebView, Object.assign({
        ref: ref
      }, props, {
        source: source
      }));
    });"
  `);
});
it(`keeps React import from tsx`, () => {
  const sourceCode = `
    'use dom';
    import React from 'react';

    export default function App() {
      return <div />;
    }`;
  const res = transformClient({
    sourceCode,
    filename: 'unknown.tsx',
    presetOptions: { disableImportExportTransform: false },
  });
  expect(res.code).toMatch(/var _react = _interopRequireDefault\(require\("react"\)\)/);
  expect(res.code).toMatch(/_react\.default/);
  expect(res.code).not.toMatch(/React\.createElement/);
});
it('allows type exports', () => {
  const sourceCode = `
    'use dom';

    export type CustomType = string;

    export interface CustomInterface {
      key: string;
    };

    export default function App() {
      return <div />;
    }
`;

  const res = transformClient({ sourceCode });
  expect(res.code).toMatch('expo/dom/internal');
});

describe('errors', () => {
  it(`throws when there are non-default exports`, () => {
    const sourceCode = `
        "use dom"

        export function App() {
        return <div />
        }`;

    expect(() => transformClient({ sourceCode })).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: Modules with the "use dom" directive only support a single default export.
        2 |         "use dom"
        3 |
      > 4 |         export function App() {
          |         ^
        5 |         return <div />
        6 |         }"
    `);
  });
  it(`throws when there is no default export`, () => {
    const sourceCode = `
"use dom"

function App() {
    return <div />
}`;

    expect(() => transformClient({ sourceCode })).toThrowErrorMatchingInlineSnapshot(`
      "/unknown: The "use dom" directive requires a default export to be present in the file.
      > 1 |
          | ^
        2 | "use dom"
        3 |
        4 | function App() {"
    `);
  });
});
