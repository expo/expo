import { vol } from 'memfs';
import * as path from 'path';

import { writeAssetMapAsync, writeDebugHtmlAsync } from '../writeContents';

describe(writeDebugHtmlAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`creates a debug html file`, async () => {
    const projectRoot = '/';
    await writeDebugHtmlAsync({
      outputDir: projectRoot,
      fileNames: ['bundles/index.ios.js', 'bundles/index.android.js', 'bundles/index.windows.js'],
    });
    expect(vol.readFileSync(path.join(projectRoot, 'debug.html'), 'utf8')).toMatchSnapshot();
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
