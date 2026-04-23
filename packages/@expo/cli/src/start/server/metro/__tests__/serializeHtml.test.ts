import type { SerialAsset } from '@expo/metro-config/src/serializer/serializerAssets';

import {
  serializeHtmlWithAssets,
  assetsRequiresSort,
  sortMatchedAssetsByEntryPoints,
} from '../serializeHtml';

it('serializes development static html', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: '/Users/path/to/expo/packages/expo-router/entry.js',
        originFilename: '../../packages/expo-router/entry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    baseUrl: '',
    isExporting: false,
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    devBundleUrl: '/packages/expo-router/entry.bundle?platform=web',
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(/<script src="\/packages\/expo-router\/entry\.bundle\?platform=web" defer>/);
});

it('injects hydration flag', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: 'dist/entry.js',
        originFilename: '../../packages/expo-router/entry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    baseUrl: '',
    isExporting: true,
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    devBundleUrl: '/packages/expo-router/entry.bundle?platform=web',
    hydrate: true,
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(/__EXPO_ROUTER_HYDRATE__/);
});

it('serializes production static html for export', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: 'dist/entry.js',
        originFilename: '../../packages/expo-router/entry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    baseUrl: '',
    isExporting: true,
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    devBundleUrl: '/packages/expo-router/entry.bundle?platform=web',
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(/<script src="\/dist\/entry\.js" defer>/);
});

it('serializes development export static html with correct script src', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: '/Users/path/to/expo/app/node_modules/expo/AppEntry.js',
        originFilename: 'node_modules/expo/AppEntry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    // Note, when `isExporting` is true, we combine `baseUrl` with the filename
    // Wehn empty, this caused an additional `/` to be added at the beginning of the `<script src="" />` tag
    baseUrl: '',
    isExporting: true,
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(
    // Note the explicit `/Users` part, not adding a double `//` by accident
    /<script src="\/Users\/path\/to\/expo\/app\/node_modules\/expo\/AppEntry.js" defer>/
  );
});

it('serializes development export static html with correct baseUrl and script src', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: '/Users/path/to/expo/app/node_modules/expo/AppEntry.js',
        originFilename: 'node_modules/expo/AppEntry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
    ],
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    // Note, when `isExporting` is true, we combine `baseUrl` with the filename
    // Wehn empty, this caused an additional `/` to be added at the beginning of the `<script src="" />` tag
    baseUrl: '/custom/base/url/',
    isExporting: true,
  });
  expect(res).toMatchSnapshot();
  expect(res).toMatch(
    // Note the explicit `/Users` part, not adding a double `//` by accident
    /<script src="\/custom\/base\/url\/Users\/path\/to\/expo\/app\/node_modules\/expo\/AppEntry.js" defer>/
  );
});

it('serializes HTML with async chunks in correct order for dynamic routes', () => {
  const res = serializeHtmlWithAssets({
    resources: [
      {
        filename: 'dist/entry.js',
        originFilename: 'entry.js',
        type: 'js',
        metadata: { isAsync: false, requires: [], modulePaths: [] },
        source: '',
      },
      {
        filename: 'dist/chunk-page.js',
        originFilename: 'chunk-page.js',
        type: 'js',
        metadata: { isAsync: true, requires: [], modulePaths: ['/app/[slug].tsx'] },
        source: '',
      },
      {
        filename: 'dist/chunk-layout.js',
        originFilename: 'chunk-layout.js',
        type: 'js',
        metadata: { isAsync: true, requires: [], modulePaths: ['/app/_layout.tsx'] },
        source: '',
      },
    ],
    baseUrl: '',
    isExporting: true,
    template: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
    route: {
      contextKey: './[slug].tsx',
      entryPoints: ['/app/_layout.tsx', '/app/[slug].tsx'],
    } as any,
  });

  expect(res).toContain(
    '<script src="/dist/chunk-layout.js" defer></script><script src="/dist/chunk-page.js" defer></script>'
  );
});

it('sorts assets based on requires tree', () => {
  const assets: SerialAsset[] = [
    {
      filename: 'a.js',
      originFilename: 'a.ts',
      type: 'js',
      metadata: { requires: ['d.js', 'b.js'] },
      source: '// a code',
    },
    {
      filename: 'b.js',
      originFilename: 'b.ts',
      type: 'js',
      metadata: { requires: ['d.js'] },
      source: '// b code',
    },
    {
      filename: 'c.js',
      originFilename: 'c.ts',
      type: 'js',
      metadata: { requires: [] },
      source: '// c code',
    },
    {
      filename: 'd.js',
      originFilename: 'd.ts',
      type: 'js',
      metadata: { requires: ['c.js'] },
      source: '// d code',
    },
  ];
  const sortedAssets = assetsRequiresSort(assets);
  expect(sortedAssets).toMatchInlineSnapshot(`
    [
      {
        "filename": "c.js",
        "metadata": {
          "requires": [],
        },
        "originFilename": "c.ts",
        "source": "// c code",
        "type": "js",
      },
      {
        "filename": "d.js",
        "metadata": {
          "requires": [
            "c.js",
          ],
        },
        "originFilename": "d.ts",
        "source": "// d code",
        "type": "js",
      },
      {
        "filename": "b.js",
        "metadata": {
          "requires": [
            "d.js",
          ],
        },
        "originFilename": "b.ts",
        "source": "// b code",
        "type": "js",
      },
      {
        "filename": "a.js",
        "metadata": {
          "requires": [
            "d.js",
            "b.js",
          ],
        },
        "originFilename": "a.ts",
        "source": "// a code",
        "type": "js",
      },
    ]
  `);
});

describe(sortMatchedAssetsByEntryPoints, () => {
  it('corrects incorrectly ordered chunks', () => {
    const assets: SerialAsset[] = [
      {
        filename: 'chunk-page.js',
        originFilename: 'chunk-page.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/[slug].tsx'] },
        source: '',
      },
      {
        filename: 'chunk-layout.js',
        originFilename: 'chunk-layout.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/_layout.tsx'] },
        source: '',
      },
    ];

    const sorted = sortMatchedAssetsByEntryPoints(assets, ['/app/_layout.tsx', '/app/[slug].tsx']);
    expect(sorted.map((a) => a.filename)).toEqual(['chunk-layout.js', 'chunk-page.js']);
  });

  it('preserves already correct order', () => {
    const assets: SerialAsset[] = [
      {
        filename: 'chunk-layout.js',
        originFilename: 'chunk-layout.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/_layout.tsx'] },
        source: '',
      },
      {
        filename: 'chunk-page.js',
        originFilename: 'chunk-page.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/index.tsx'] },
        source: '',
      },
    ];
    const sorted = sortMatchedAssetsByEntryPoints(assets, ['/app/_layout.tsx', '/app/index.tsx']);
    expect(sorted.map((a) => a.filename)).toEqual(['chunk-layout.js', 'chunk-page.js']);
  });

  it('handles nested layouts', () => {
    const assets: SerialAsset[] = [
      {
        filename: 'chunk-root.js',
        originFilename: 'chunk-root.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/_layout.tsx'] },
        source: '',
      },
      {
        filename: 'chunk-nested.js',
        originFilename: 'chunk-nested.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/settings/_layout.tsx'] },
        source: '',
      },
      {
        filename: 'chunk-page.js',
        originFilename: 'chunk-page.js',
        type: 'js',
        metadata: { isAsync: true, modulePaths: ['/app/settings/profile.tsx'] },
        source: '',
      },
    ];

    const sorted = sortMatchedAssetsByEntryPoints(assets, [
      '/app/_layout.tsx',
      '/app/settings/_layout.tsx',
      '/app/settings/profile.tsx',
    ]);
    expect(sorted.map((a) => a.filename)).toEqual([
      'chunk-root.js',
      'chunk-nested.js',
      'chunk-page.js',
    ]);
  });
});
