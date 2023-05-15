import {
  getHtmlFiles,
  getPathVariations,
  getFilesToExportFromServerAsync,
} from '../exportStaticAsync';

describe(getPathVariations, () => {
  it(`should get path variations`, () => {
    expect(getPathVariations('(foo)/bar/(bax)/baz').sort((a, b) => a.length - b.length)).toEqual([
      'bar/baz',
      'bar/(bax)/baz',
      '(foo)/bar/baz',
      '(foo)/bar/(bax)/baz',
    ]);
  });
});

describe(getHtmlFiles, () => {
  it(`should get html files`, () => {
    expect(
      getHtmlFiles({
        manifest: {
          initialRouteName: undefined,
          screens: {
            alpha: {
              path: 'alpha',
              screens: { index: '', second: 'second' },
              initialRouteName: 'index',
            },
            '(app)': {
              path: '(app)',
              screens: { compose: 'compose', index: '', 'note/[note]': 'note/:note' },
              initialRouteName: 'index',
            },
            '(auth)/sign-in': '(auth)/sign-in',
            _sitemap: '_sitemap',
            '[...404]': '*404',
          },
        },
      }).sort((a, b) => a.length - b.length)
    ).toEqual([
      'index.html',
      'compose.html',
      'sign-in.html',
      '_sitemap.html',
      '[...404].html',
      'alpha/index.html',
      '(app)/index.html',
      'note/[note].html',
      'alpha/second.html',
      '(app)/compose.html',
      '(auth)/sign-in.html',
      '(app)/note/[note].html',
    ]);
  });
});

describe(getFilesToExportFromServerAsync, () => {
  it(`should export from server async`, async () => {
    const renderAsync = jest.fn(async () => '');
    expect(
      await getFilesToExportFromServerAsync({
        manifest: {
          initialRouteName: undefined,
          screens: {
            alpha: {
              path: 'alpha',
              screens: { index: '', second: 'second' },
              initialRouteName: 'index',
            },
            '(app)': {
              path: '(app)',
              screens: { compose: 'compose', index: '', 'note/[note]': 'note/:note' },
              initialRouteName: 'index',
            },
            '(auth)/sign-in': '(auth)/sign-in',
            _sitemap: '_sitemap',
            '[...404]': '*404',
          },
        },
        renderAsync,
      })
    ).toEqual(
      new Map([
        ['(app)/compose.html', ''],
        ['(app)/index.html', ''],
        ['(app)/note/[note].html', ''],
        ['(auth)/sign-in.html', ''],
        ['[...404].html', ''],
        ['sign-in.html', ''],
        ['alpha/index.html', ''],
        ['alpha/second.html', ''],
        // ['[...404].html', ''],
        ['_sitemap.html', ''],
        ['compose.html', ''],
        ['index.html', ''],
        ['note/[note].html', ''],
      ])
    );
  });
});
