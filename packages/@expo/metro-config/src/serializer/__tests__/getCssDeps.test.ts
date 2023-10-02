import { getCssSerialAssets, fileNameFromContents, JSModule } from '../getCssDeps';

describe(fileNameFromContents, () => {
  it('returns the filename from the filepath', () => {
    expect(fileNameFromContents({ filepath: '/', src: 'foo' })).toMatchInlineSnapshot(
      `"-1effb2475fcfba4f9e8b8a1dbc8f3caf"`
    );
  });
  it('returns the filename from the filepath with encoded path', () => {
    expect(
      fileNameFromContents({ filepath: 'node_modules%5Cexpo-router%5Centry.js', src: 'foo' })
    ).toBe('entry-cee888899be3eec9e9f3f1adf89597b8');
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
  inverseDependencies: new Set(),
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
  inverseDependencies: new Set(['/root/foo']),
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
          processModuleFilter(modules) {
            return true;
          },
          projectRoot: '/',
        }
      )
    ).toEqual([
      {
        filename: '_expo/static/css/foobar-572ab956c69cfba498b99ddeaa42abd8.css',
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
