import assert from 'assert';
import { vol } from 'memfs';
import path from 'path';

import {
  writeAssetMapAsync,
  writeBundlesAsync,
  writeDebugHtmlAsync,
  writeSourceMapsAsync,
} from '../writeContents';

describe(writeDebugHtmlAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`creates a debug html file`, async () => {
    const projectRoot = '/';
    await writeDebugHtmlAsync({
      outputDir: projectRoot,
      fileNames: { ios: 'index.ios.js', android: 'index.android.js', windows: 'index.windows.js' },
    });
    expect(vol.readFileSync(path.join(projectRoot, 'debug.html'), 'utf8')).toMatchSnapshot();
  });
});

describe(writeBundlesAsync, () => {
  afterEach(() => {
    vol.reset();
  });
  it(`writes JS bundles to disk`, async () => {
    const projectRoot = '/';

    const contents = `var foo = true;`;
    const results = await writeBundlesAsync({
      outputDir: projectRoot,
      bundles: {
        ios: {
          code: contents,
        },
        android: {
          code: contents,
        },
      },
    });

    expect(results.fileNames.android).toBeDefined();

    expect(results.fileNames.ios).toBe('ios-4fe3891dcaca43901bd8797db78405e4.js');
    expect(results.hashes).toStrictEqual({
      ios: expect.any(String),
      android: expect.any(String),
    });
    expect(vol.readFileSync(path.join(projectRoot, results.fileNames.ios!), 'utf8')).toBe(contents);
  });
  it(`writes hbc bundles to disk`, async () => {
    const projectRoot = '/';
    const contents = Uint8Array.from([1, 2, 3]);
    const results = await writeBundlesAsync({
      outputDir: projectRoot,
      bundles: {
        ios: {
          // this overwrites js code if present
          hermesBytecodeBundle: contents,
          code: 'var foo = true;',
        },
      },
    });

    expect(results.fileNames.ios).toBe('ios-5289df737df57326fcdd22597afb1fac.js');
    expect(results.hashes).toStrictEqual({
      ios: expect.any(String),
    });
    expect(vol.readFileSync(path.join(projectRoot, results.fileNames.ios!))).toBeDefined();
  });
});

describe(writeAssetMapAsync, () => {
  afterEach(() => {
    vol.reset();
  });
  it(`writes asset map to disk`, async () => {
    const projectRoot = '/';

    const results = await writeAssetMapAsync({
      outputDir: projectRoot,
      assets: [{ hash: 'alpha' }, { hash: 'beta' }] as any,
    });

    expect(results).toStrictEqual({
      alpha: { hash: 'alpha' },
      beta: { hash: 'beta' },
    });

    expect(
      JSON.parse(vol.readFileSync(path.join(projectRoot, 'assetmap.json'), 'utf8') as string)
    ).toBeDefined();
  });
});

describe(writeSourceMapsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`writes source maps to disk`, async () => {
    const projectRoot = '/';

    // User wrote this
    const contents = `var foo = true;\ninvalid-source-map-comment`;

    // Metro made this
    const bundles = {
      ios: {
        code: contents,
        map: 'ios_map',
      },
      android: {
        code: contents,
        map: 'android_map',
      },
    };

    // Expo persists the code and returns info
    const jsResults = await writeBundlesAsync({
      outputDir: projectRoot,
      bundles,
    });

    // Expo also modifies the source maps and persists
    const results = await writeSourceMapsAsync({
      outputDir: projectRoot,
      hashes: jsResults.hashes,
      fileNames: jsResults.fileNames,
      bundles,
    });

    for (const item of results) {
      assert(item);
      expect(vol.readFileSync(path.join(projectRoot, item.fileName), 'utf8')).toBe(item.map);
      expect(
        vol.readFileSync(path.join(projectRoot, `${item.platform}-${item.hash}.js`), 'utf8')
      ).toMatch(/\/\/# sourceMappingURL=/);
      // // Removed by `removeOriginalSourceMappingUrl`
      // expect(
      //   vol.readFileSync(path.join(projectRoot, `${item.platform}-${item.hash}.js`), 'utf8')
      // ).not.toMatch(/invalid-source-map-comment/);
    }
  });

  it(`skips writing when the map is not defined`, async () => {
    const projectRoot = '/';

    // User wrote this
    const contents = `var foo = true;\ninvalid-source-map-comment`;

    // Metro made this
    const bundles = {
      ios: {
        code: contents,
      },
      android: {
        code: contents,
        map: 'android_map',
      },
    };

    // Expo persists the code and returns info
    const jsResults = await writeBundlesAsync({
      outputDir: projectRoot,
      bundles,
    });

    // Expo also modifies the source maps and persists
    const results = await writeSourceMapsAsync({
      outputDir: projectRoot,
      hashes: jsResults.hashes,
      fileNames: jsResults.fileNames,
      bundles,
    });

    expect(results).toHaveLength(1);
  });
});
