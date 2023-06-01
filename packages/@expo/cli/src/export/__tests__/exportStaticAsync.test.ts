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
  it(`should get path variations 1`, () => {
    expect(getPathVariations('a').sort((a, b) => a.length - b.length)).toEqual(['a']);
    expect(getPathVariations('(a)').sort((a, b) => a.length - b.length)).toEqual(['(a)']);
  });
  it(`should get path variations 2`, () => {
    expect(getPathVariations('(a)/b').sort((a, b) => a.length - b.length)).toEqual(['b', '(a)/b']);
    expect(getPathVariations('(a)/(b)').sort((a, b) => a.length - b.length)).toEqual([
      '(b)',
      '(a)',
      '(a)/(b)',
    ]);
  });
  it(`should get path variations 3`, () => {
    expect(getPathVariations('(a)/(b)/c').sort((a, b) => a.length - b.length)).toEqual([
      'c',
      '(b)/c',
      '(a)/c',
      '(a)/(b)/c',
    ]);
  });
  it(`should get path variations 4`, () => {
    expect(getPathVariations('(a)/(b)/c/(d)/(e)/f').sort((a, b) => a.length - b.length)).toEqual([
      'c/f',
      '(b)/c/f',
      'c/(e)/f',
      'c/(d)/f',
      '(a)/c/f',
      '(b)/c/(e)/f',
      '(b)/c/(d)/f',
      'c/(d)/(e)/f',
      '(a)/c/(e)/f',
      '(a)/c/(d)/f',
      '(a)/(b)/c/f',
      '(b)/c/(d)/(e)/f',
      '(a)/c/(d)/(e)/f',
      '(a)/(b)/c/(e)/f',
      '(a)/(b)/c/(d)/f',
      '(a)/(b)/c/(d)/(e)/f',
    ]);
  });
  it(`should get path variations 5`, () => {
    expect(getPathVariations('a/(b)').sort((a, b) => a.length - b.length)).toEqual(['a', 'a/(b)']);
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
  it(`should get html files 2`, () => {
    expect(
      getHtmlFiles({
        manifest: {
          initialRouteName: undefined,
          screens: {
            '(root)': {
              path: '(root)',
              screens: {
                '(index)': {
                  path: '(index)',
                  screens: {
                    '[...missing]': '*missing',
                    index: '',
                    notifications: 'notifications',
                  },
                  initialRouteName: 'index',
                },
              },
              initialRouteName: '(index)',
            },
          },
        },
      }).sort((a, b) => a.length - b.length)
    ).toEqual([
      'index.html',
      '[...missing].html',
      '(root)/index.html',
      '(index)/index.html',
      'notifications.html',
      '(root)/[...missing].html',
      '(index)/[...missing].html',
      '(root)/(index)/index.html',
      '(root)/notifications.html',
      '(index)/notifications.html',
      '(root)/(index)/[...missing].html',
      '(root)/(index)/notifications.html',
    ]);
  });
});

describe(getFilesToExportFromServerAsync, () => {
  it(`should export from server async`, async () => {
    const renderAsync = jest.fn(async () => '');
    expect(
      await getFilesToExportFromServerAsync('/', {
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
