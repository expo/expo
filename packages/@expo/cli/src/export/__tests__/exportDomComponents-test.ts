import crypto from 'crypto';

import {
  addDomBundleToMetadataAsync,
  transformDomEntryForMd5Filename,
  transformNativeBundleForMd5Filename,
} from '../exportDomComponents';
import type { BundleOutput, ExportAssetMap } from '../saveAssets';

jest.mock('crypto');

const mockFilenameMd5 = jest.fn().mockReturnValue('MOCK_FILENAME_MD5_HASH');
const mockMd5 = jest.fn().mockReturnValue('MOCK_CONTENTS_MD5_HASH');

(crypto.createHash as jest.Mock).mockImplementation((algorithm: string) => {
  if (algorithm === 'md5') {
    const self = {
      isFilename: false,
      update: jest.fn().mockImplementation((source) => {
        self.isFilename = source.startsWith('file://');
        return self;
      }),
      digest: jest.fn().mockImplementation(() => {
        return self.isFilename ? mockFilenameMd5() : mockMd5();
      }),
    };
    return self;
  }
  return jest.fn();
});

describe(addDomBundleToMetadataAsync, () => {
  it('should add DOM bundle to metadata', async () => {
    const domComponentBundle: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom1.js',
          originFilename: 'node_modules/expo/dom/entry.js',
          type: 'js',
          metadata: {},
          source: 'dummy',
        },
      ],
      assets: [
        {
          __packager_asset: true,
          fileSystemLocation: '/Users/kudo/sdk52domota/assets/images',
          httpServerLocation: './assets/assets/images',
          width: 100,
          height: 100,
          scales: [1, 2, 3],
          files: [
            '/Users/kudo/sdk52domota/assets/images/react-logo.png',
            '/Users/kudo/sdk52domota/assets/images/react-logo@2x.png',
            '/Users/kudo/sdk52domota/assets/images/react-logo@3x.png',
          ],
          hash: '633435dcb418833920a16771610ca404',
          name: 'react-logo.d883906de993aa65bf0ef0d1bc2ff6ad',
          type: 'png',
          fileHashes: [
            '695d5a1c6f29a689130f3aaa573aec6e',
            'b507e7f2c91ebc8fe24dee79ccb3b600',
            '8a4d0e5b845044e56e3b2df627d01cfd',
          ],
        },
      ],
    };

    const metadata = await addDomBundleToMetadataAsync(domComponentBundle);
    expect(metadata).toEqual([
      {
        ext: 'js',
        path: 'www.bundle/_expo/static/js/web/entry-dom1.js',
      },
    ]);
  });
});

describe(transformDomEntryForMd5Filename, () => {
  it('should rename by MD5 content and return metadata in new filename', () => {
    const files: ExportAssetMap = new Map([
      [
        'www.bundle/dom1.html',
        {
          contents: 'dummy',
        },
      ],
    ]);
    const metadata = transformDomEntryForMd5Filename({
      htmlOutputName: 'www.bundle/dom1.html',
      files,
    });
    expect(metadata).toEqual([{ path: 'www.bundle/MOCK_CONTENTS_MD5_HASH.html', ext: 'html' }]);
  });
});

describe(transformNativeBundleForMd5Filename, () => {
  it('should update asset paths and remove leading slashes from filenames', () => {
    const domComponentReference = 'file:///app/components/DomView.tsx';
    const nativeBundle1Chunk = `
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0]);
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _react = _interopRequireDefault(require(_dependencyMap[1]));
  var _internal = require(_dependencyMap[2]);
  var filePath = "${mockFilenameMd5()}.html";
  var _default = exports.default = _react.default.forwardRef((props, ref) => {
    return _react.default.createElement(_internal.WebView, {
      ref,
      ...props,
      filePath,
    });
  });
},896,[4,157,897]);
`;

    const domHtml1 = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">

        <style id="expo-dom-component-style">
        /* These styles make the body full-height */
        html,
        body {
          -webkit-overflow-scrolling: touch; /* Enables smooth momentum scrolling */
        }
        /* These styles make the root element full-height */
        #root {
          display: flex;
          flex: 1;
        }
        </style>
    </head>
    <body>
    <noscript>DOM Components require <code>javaScriptEnabled</code></noscript>
        <!-- Root element for the DOM component. -->
        <div id="root"></div>

    <script src="./_expo/static/js/web/entry-dom1.js" defer></script>
</body>
</html>
`;
    const domBundle1Chunk = `
__d((function(g,r,i,a,m,e,d){m.exports={uri:"assets/assets/images/react-logo.d883906de993aa65bf0ef0d1bc2ff6ad.png",width:100,height:100}}),1168,[]);
`;
    const nativeBundle: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/ios/entry-native1.js',
          originFilename: 'node_modules/expo-router/entry.js',
          type: 'js',
          metadata: {},
          source: nativeBundle1Chunk,
        },
      ],
      assets: [
        {
          __packager_asset: true,
          fileSystemLocation: '/app/node_modules/@react-navigation/elements/lib/commonjs/assets',
          httpServerLocation:
            './assets/node_modules/@react-navigation/elements/lib/commonjs/assets',
          width: 96,
          height: 96,
          scales: [1, 2, 3],
          files: [
            '/app/node_modules/@react-navigation/elements/lib/commonjs/assets/close-icon.png',
            '/app/node_modules/@react-navigation/elements/lib/commonjs/assets/close-icon@2x.png',
            '/app/node_modules/@react-navigation/elements/lib/commonjs/assets/close-icon@3x.png',
          ],
          hash: '3162e8a244d8f6fbd259e79043e23ce4',
          name: 'close-icon',
          type: 'png',
          fileHashes: [
            'd84e297c3b3e49a614248143d53e40ca',
            '1190ab078c57159f4245a328118fcd9a',
            '0747a1317bbe9c6fc340b889ef8ab3ae',
          ],
        },
      ],
    };

    const files: ExportAssetMap = new Map([
      [
        '_expo/static/js/ios/entry-native1.js',
        {
          contents: nativeBundle1Chunk,
        },
      ],
      [
        '/www.bundle/_expo/static/js/web/entry-dom1.js',
        {
          contents: domBundle1Chunk,
        },
      ],
      [
        'www.bundle/dom1.html',
        {
          contents: domHtml1,
        },
      ],
    ]);
    const htmlOutputName = 'www.bundle/dom1.html';

    transformNativeBundleForMd5Filename({
      domComponentReference,
      nativeBundle,
      files,
      htmlOutputName,
    });

    const nativeJsContents = files.get('_expo/static/js/ios/entry-native1.js')?.contents;
    expect(nativeJsContents).not.toEqual(nativeBundle1Chunk);
    expect(nativeJsContents).toContain('MOCK_CONTENTS_MD5_HASH');
  });
});

describe('Multiple DOM components metadata accumulation', () => {
  it('should accumulate metadata from multiple DOM components instead of overwriting', async () => {
    // This test verifies the fix for the bug where metadata from multiple DOM components
    // was being overwritten instead of accumulated, causing 404s after EAS updates
    // See: https://github.com/expo/expo/issues/37269

    const domComponentBundle1: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom1.js',
          originFilename: 'components/Editor1.js',
          type: 'js',
          metadata: {},
          source: 'console.log("dom1")',
        },
      ],
      assets: [],
    };

    const domComponentBundle2: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom2.js',
          originFilename: 'components/Editor2.js',
          type: 'js',
          metadata: {},
          source: 'console.log("dom2")',
        },
      ],
      assets: [],
    };

    const domComponentBundle3: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom3.js',
          originFilename: 'components/Editor3.js',
          type: 'js',
          metadata: {},
          source: 'console.log("dom3")',
        },
      ],
      assets: [],
    };

    // Simulate the metadata accumulation logic from exportApp.ts
    const domComponentAssetsMetadata: Record<string, any[]> = {};
    const platform = 'ios';

    // Process first DOM component using the FIXED logic (accumulates)
    const files1: ExportAssetMap = new Map([
      ['www.bundle/dom1.html', { contents: '<html>DOM1</html>' }],
    ]);

    domComponentAssetsMetadata[platform] = [
      ...(domComponentAssetsMetadata[platform] || []),
      ...(await addDomBundleToMetadataAsync(domComponentBundle1)),
      ...transformDomEntryForMd5Filename({
        files: files1,
        htmlOutputName: 'www.bundle/dom1.html',
      }),
    ];

    // Process second DOM component using the FIXED logic (accumulates)
    const files2: ExportAssetMap = new Map([
      ['www.bundle/dom2.html', { contents: '<html>DOM2</html>' }],
    ]);

    domComponentAssetsMetadata[platform] = [
      ...(domComponentAssetsMetadata[platform] || []),
      ...(await addDomBundleToMetadataAsync(domComponentBundle2)),
      ...transformDomEntryForMd5Filename({
        files: files2,
        htmlOutputName: 'www.bundle/dom2.html',
      }),
    ];

    // Process third DOM component using the FIXED logic (accumulates)
    const files3: ExportAssetMap = new Map([
      ['www.bundle/dom3.html', { contents: '<html>DOM3</html>' }],
    ]);

    domComponentAssetsMetadata[platform] = [
      ...(domComponentAssetsMetadata[platform] || []),
      ...(await addDomBundleToMetadataAsync(domComponentBundle3)),
      ...transformDomEntryForMd5Filename({
        files: files3,
        htmlOutputName: 'www.bundle/dom3.html',
      }),
    ];

    // Verify all DOM components are present in metadata (not overwritten)
    expect(domComponentAssetsMetadata[platform]).toHaveLength(6); // 3 JS + 3 HTML files

    // Verify JS metadata entries
    const jsEntries = domComponentAssetsMetadata[platform].filter((entry) => entry.ext === 'js');
    expect(jsEntries).toHaveLength(3);
    expect(jsEntries[0].path).toBe('www.bundle/_expo/static/js/web/entry-dom1.js');
    expect(jsEntries[1].path).toBe('www.bundle/_expo/static/js/web/entry-dom2.js');
    expect(jsEntries[2].path).toBe('www.bundle/_expo/static/js/web/entry-dom3.js');

    // Verify HTML metadata entries
    const htmlEntries = domComponentAssetsMetadata[platform].filter(
      (entry) => entry.ext === 'html'
    );
    expect(htmlEntries).toHaveLength(3);
    expect(htmlEntries[0].path).toBe('www.bundle/MOCK_CONTENTS_MD5_HASH.html');
    expect(htmlEntries[1].path).toBe('www.bundle/MOCK_CONTENTS_MD5_HASH.html');
    expect(htmlEntries[2].path).toBe('www.bundle/MOCK_CONTENTS_MD5_HASH.html');
  });

  it('should demonstrate the bug when using the OLD overwriting logic', async () => {
    // This test simulates the BUGGY behavior that was happening before our fix
    // It should show only the last DOM component's metadata (the bug!)
    // See: https://github.com/expo/expo/issues/37269

    const domComponentBundle1: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom1.js',
          originFilename: 'components/Editor1.js',
          type: 'js',
          metadata: {},
          source: 'console.log("dom1")',
        },
      ],
      assets: [],
    };

    const domComponentBundle2: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom2.js',
          originFilename: 'components/Editor2.js',
          type: 'js',
          metadata: {},
          source: 'console.log("dom2")',
        },
      ],
      assets: [],
    };

    const domComponentBundle3: BundleOutput = {
      artifacts: [
        {
          filename: '_expo/static/js/web/entry-dom3.js',
          originFilename: 'components/Editor3.js',
          type: 'js',
          metadata: {},
          source: 'console.log("dom3")',
        },
      ],
      assets: [],
    };

    // Simulate the BUGGY metadata accumulation logic (overwriting instead of accumulating)
    const domComponentAssetsMetadata: Record<string, any[]> = {};
    const platform = 'ios';

    // Process first DOM component using OLD BUGGY logic (overwrites)
    const files1: ExportAssetMap = new Map([
      ['www.bundle/dom1.html', { contents: '<html>DOM1</html>' }],
    ]);

    domComponentAssetsMetadata[platform] = [
      ...(await addDomBundleToMetadataAsync(domComponentBundle1)),
      ...transformDomEntryForMd5Filename({
        files: files1,
        htmlOutputName: 'www.bundle/dom1.html',
      }),
    ];

    // Process second DOM component using OLD BUGGY logic (overwrites previous!)
    const files2: ExportAssetMap = new Map([
      ['www.bundle/dom2.html', { contents: '<html>DOM2</html>' }],
    ]);

    domComponentAssetsMetadata[platform] = [
      ...(await addDomBundleToMetadataAsync(domComponentBundle2)),
      ...transformDomEntryForMd5Filename({
        files: files2,
        htmlOutputName: 'www.bundle/dom2.html',
      }),
    ];

    // Process third DOM component using OLD BUGGY logic (overwrites previous!)
    const files3: ExportAssetMap = new Map([
      ['www.bundle/dom3.html', { contents: '<html>DOM3</html>' }],
    ]);

    domComponentAssetsMetadata[platform] = [
      ...(await addDomBundleToMetadataAsync(domComponentBundle3)),
      ...transformDomEntryForMd5Filename({
        files: files3,
        htmlOutputName: 'www.bundle/dom3.html',
      }),
    ];

    // With the BUGGY logic, only the LAST DOM component should be present (dom3)
    expect(domComponentAssetsMetadata[platform]).toHaveLength(2); // Only 1 JS + 1 HTML file (the last one!)

    // Verify only the LAST DOM component's metadata is present
    const jsEntries = domComponentAssetsMetadata[platform].filter((entry) => entry.ext === 'js');
    expect(jsEntries).toHaveLength(1);
    expect(jsEntries[0].path).toBe('www.bundle/_expo/static/js/web/entry-dom3.js'); // Only dom3!

    const htmlEntries = domComponentAssetsMetadata[platform].filter(
      (entry) => entry.ext === 'html'
    );
    expect(htmlEntries).toHaveLength(1);
    expect(htmlEntries[0].path).toBe('www.bundle/MOCK_CONTENTS_MD5_HASH.html'); // Only dom3's HTML!

    // dom1 and dom2 should be missing (this was the bug!)
    const allPaths = domComponentAssetsMetadata[platform].map((entry) => entry.path);
    expect(allPaths).not.toContain('www.bundle/_expo/static/js/web/entry-dom1.js');
    expect(allPaths).not.toContain('www.bundle/_expo/static/js/web/entry-dom2.js');
  });
});

describe('Concurrent DOM component metadata accumulation (race condition)', () => {
  // The spread-accumulation fix (`domComponentAssetsMetadata[platform] =
  // [...(domComponentAssetsMetadata[platform] || []), ...newEntries]`) is a
  // non-atomic read-modify-write. `exportApp.ts` processes DOM components via
  // `Promise.all(expoDomComponentReferences.map(async (filePath) => { ... }))`,
  // so multiple callbacks can be in flight at once. If callback A reads the
  // array (to spread it) before callback B has written its own update back,
  // A's write clobbers B's — even though the accumulation *logic* is correct
  // in isolation, it is not safe under concurrent execution.
  //
  // This suite exercises that scenario directly by staggering resolution
  // order (the component processed *first* finishes *last*, as commonly
  // happens when component export cost varies), which the previous
  // sequential-only tests (see suite above) do not cover.
  // See: https://github.com/expo/expo/issues/37269

  const makeBundle = (n: number): BundleOutput => ({
    artifacts: [
      {
        filename: `_expo/static/js/web/entry-dom${n}.js`,
        originFilename: `components/Editor${n}.js`,
        type: 'js',
        metadata: {},
        source: `console.log("dom${n}")`,
      },
    ],
    assets: [],
  });

  // A delayed variant of `addDomBundleToMetadataAsync` — standing in for
  // real-world variance in how long each DOM component's own bundling takes.
  const addDomBundleToMetadataAfterDelay = async (bundle: BundleOutput, delayMs: number) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return addDomBundleToMetadataAsync(bundle);
  };

  // Mirrors the exact shape of the accumulation statement in `exportApp.ts`:
  // the existing array is READ as the first spread element (synchronously),
  // then the function SUSPENDS mid-expression on
  // `...(await addDomBundleToMetadataAsync(...))`, and only WRITES the
  // result back once that resolves. Critically, the `await` sits *inside*
  // the array literal, between the read and the write — putting the delay
  // before this statement (as if awaiting a slow `exportDomComponentAsync`
  // call first) would NOT reproduce the bug, because by the time the
  // statement itself runs, it executes as a single synchronous read+write
  // with no interleaving opportunity. The race exists only because
  // `exportApp.ts` awaits *while already inside* the assignment expression.
  const accumulate = async (
    domComponentAssetsMetadata: Record<string, any[]>,
    platform: string,
    bundle: BundleOutput,
    htmlOutputName: string,
    files: ExportAssetMap,
    delayMs: number
  ) => {
    domComponentAssetsMetadata[platform] = [
      ...(domComponentAssetsMetadata[platform] || []),
      ...(await addDomBundleToMetadataAfterDelay(bundle, delayMs)),
      ...transformDomEntryForMd5Filename({ files, htmlOutputName }),
    ];
  };

  it('drops entries when processed concurrently via Promise.all (demonstrates the race)', async () => {
    const domComponentAssetsMetadata: Record<string, any[]> = {};
    const platform = 'ios';

    const files1: ExportAssetMap = new Map([
      ['www.bundle/dom1.html', { contents: '<html>DOM1</html>' }],
    ]);
    const files2: ExportAssetMap = new Map([
      ['www.bundle/dom2.html', { contents: '<html>DOM2</html>' }],
    ]);
    const files3: ExportAssetMap = new Map([
      ['www.bundle/dom3.html', { contents: '<html>DOM3</html>' }],
    ]);

    // Component 1 starts first but is the slowest to resolve — component 3
    // starts last but resolves first. This out-of-order resolution is what
    // triggers the lost-update race, even though every callback runs the
    // "fixed" spread-accumulation logic from the suite above.
    await Promise.all([
      accumulate(
        domComponentAssetsMetadata,
        platform,
        makeBundle(1),
        'www.bundle/dom1.html',
        files1,
        30
      ),
      accumulate(
        domComponentAssetsMetadata,
        platform,
        makeBundle(2),
        'www.bundle/dom2.html',
        files2,
        20
      ),
      accumulate(
        domComponentAssetsMetadata,
        platform,
        makeBundle(3),
        'www.bundle/dom3.html',
        files3,
        10
      ),
    ]);

    // With `Promise.all(map(...))`, this is fewer than the 6 entries (3 JS +
    // 3 HTML) all three components should have contributed — some were lost
    // to the race, reproducing the "missing DOM component after EAS Update"
    // bug even with the accumulation-logic fix from #38290 in place.
    expect(domComponentAssetsMetadata[platform].length).toBeLessThan(6);
  });

  it('accumulates every entry when processed sequentially (the fix)', async () => {
    const domComponentAssetsMetadata: Record<string, any[]> = {};
    const platform = 'ios';

    const filesByIndex: ExportAssetMap[] = [
      new Map([['www.bundle/dom1.html', { contents: '<html>DOM1</html>' }]]),
      new Map([['www.bundle/dom2.html', { contents: '<html>DOM2</html>' }]]),
      new Map([['www.bundle/dom3.html', { contents: '<html>DOM3</html>' }]]),
    ];
    const delays = [30, 20, 10];

    // Same staggered latencies as the failing test above, but processed with
    // a sequential `for...of` + `await` (the actual fix applied to
    // `exportApp.ts`) instead of `Promise.all(map(...))`. Because each
    // component's read-modify-write completes fully before the next one
    // starts, there is no window for a lost update regardless of how long
    // any individual component's export takes.
    for (let i = 0; i < 3; i++) {
      await accumulate(
        domComponentAssetsMetadata,
        platform,
        makeBundle(i + 1),
        `www.bundle/dom${i + 1}.html`,
        filesByIndex[i],
        delays[i]
      );
    }

    // All 3 components contribute 1 JS + 1 HTML entry each = 6 total, with
    // none lost, regardless of per-component export latency.
    expect(domComponentAssetsMetadata[platform]).toHaveLength(6);

    const jsEntries = domComponentAssetsMetadata[platform].filter((entry) => entry.ext === 'js');
    expect(jsEntries.map((e) => e.path)).toEqual([
      'www.bundle/_expo/static/js/web/entry-dom1.js',
      'www.bundle/_expo/static/js/web/entry-dom2.js',
      'www.bundle/_expo/static/js/web/entry-dom3.js',
    ]);
  });
});
