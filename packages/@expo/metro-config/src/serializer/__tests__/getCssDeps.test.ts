import { getCssSerialAssets, fileNameFromContents, JSModule } from '../getCssDeps';

describe(fileNameFromContents, () => {
  it('returns the filename from the filepath', () => {
    expect(fileNameFromContents({ filepath: '/', src: 'foo' })).toMatchInlineSnapshot(
      `"-1effb2475fcfba4f9e8b8a1dbc8f3caf"`
    );
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
        filename: '_expo/static/css/foobar-6d014d3eceae935c7be31bfa294bf590.css',
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
