import CountingSet from 'metro/src/lib/CountingSet';

import { getCssSerialAssets, fileNameFromContents, JSModule } from '../getCssDeps';

describe(fileNameFromContents, () => {
  it('returns the filename from the filepath', () => {
    expect(fileNameFromContents({ filepath: '/', src: 'foo' })).toMatchInlineSnapshot(
      `"-acbd18db4cc2f85cedef654fccc4a4d8"`
    );
  });
  it('returns the filename from the filepath with encoded path', () => {
    expect(
      fileNameFromContents({ filepath: 'node_modules%5Cexpo-router%5Centry.js', src: 'foo' })
    ).toBe('entry-acbd18db4cc2f85cedef654fccc4a4d8');
  });
});

const fooModule: JSModule = {
  dependencies: new Map([
    [
      './bar',
      {
        absolutePath: '/root/bar',
        data: { data: { asyncType: null, locs: [], key: './bar' }, name: './bar' },
      },
    ],
  ]),
  inverseDependencies: new CountingSet(),
  output: [
    {
      type: 'js/module',
      data: {
        code: '__d(function() {/* code for foo */});',
        map: null,
        lineCount: 1,
        css: {
          code: '.container { background: red; }',
          map: null,
          lineCount: 1,
        },
      },
    },
  ],
  path: '/foobar.js',
  getSource: () => Buffer.from('__d(function() {/* code for foo */});'),
};

const barModule: JSModule = {
  path: '/root/bar',
  dependencies: new Map(),
  inverseDependencies: new CountingSet(['/root/foo']),
  output: [
    {
      type: 'js/module',
      data: {
        code: '__d(function() {/* code for bar */});',
        map: [],
        lineCount: 1,
      },
    },
  ],
  getSource: () => Buffer.from('bar-source'),
};

describe(getCssSerialAssets, () => {
  it(`returns css serial assets`, () => {
    expect(
      getCssSerialAssets(
        new Map([
          ['/foobar.js', fooModule],
          ['/root/bar', barModule],
        ]),
        {
          entryFile: '/foobar.js',
          projectRoot: '/',
        }
      )
    ).toEqual([
      {
        filename: '_expo/static/css/foobar-fee1d601d0689f88ee4e04e21e7a7128.css',
        metadata: {
          hmrId: 'foobar_js',
        },
        originFilename: 'foobar.js',
        source: '.container { background: red; }',
        type: 'css',
      },
    ]);
  });
});
