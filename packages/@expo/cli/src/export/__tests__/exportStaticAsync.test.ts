import {
  getHtmlFiles,
  getPathVariations,
  getFilesToExportFromServerAsync,
} from '../exportStaticAsync';

describe(getPathVariations, () => {
  it(`should get path variations`, () => {
    expect(getPathVariations('(foo)/bar/(bax)/baz').sort()).toEqual([
      '(foo)/bar/(bax)/baz',
      '(foo)/bar/baz',
      'bar/(bax)/baz',
      'bar/baz',
    ]);
  });

  it(`should get path variations with group array syntax`, () => {
    expect(getPathVariations('(foo,foobar)/bar/(bax,baxbax, baxbaxbax)/baz').sort()).toEqual([
      '(foo)/bar/(bax)/baz',
      '(foo)/bar/(baxbax)/baz',
      '(foo)/bar/(baxbaxbax)/baz',
      '(foo)/bar/baz',
      '(foobar)/bar/(bax)/baz',
      '(foobar)/bar/(baxbax)/baz',
      '(foobar)/bar/(baxbaxbax)/baz',
      '(foobar)/bar/baz',
      'bar/(bax)/baz',
      'bar/(baxbax)/baz',
      'bar/(baxbaxbax)/baz',
      'bar/baz',
    ]);
  });
  it(`should get path variations 1`, () => {
    expect(getPathVariations('a').sort()).toEqual(['a']);
    expect(getPathVariations('(a)').sort()).toEqual(['(a)']);
  });
  it(`should get path variations 2`, () => {
    expect(getPathVariations('(a)/b').sort()).toEqual(['(a)/b', 'b']);
    expect(getPathVariations('(a)/(b)').sort()).toEqual(['(a)', '(a)/(b)', '(b)']);
  });
  it(`should get path variations 3`, () => {
    expect(getPathVariations('(a)/(b)/c').sort()).toEqual(['(a)/(b)/c', '(a)/c', '(b)/c', 'c']);
  });
  it(`should get path variations 4`, () => {
    expect(getPathVariations('(a)/(b)/c/(d)/(e)/f').sort()).toEqual([
      '(a)/(b)/c/(d)/(e)/f',
      '(a)/(b)/c/(d)/f',
      '(a)/(b)/c/(e)/f',
      '(a)/(b)/c/f',
      '(a)/c/(d)/(e)/f',
      '(a)/c/(d)/f',
      '(a)/c/(e)/f',
      '(a)/c/f',
      '(b)/c/(d)/(e)/f',
      '(b)/c/(d)/f',
      '(b)/c/(e)/f',
      '(b)/c/f',
      'c/(d)/(e)/f',
      'c/(d)/f',
      'c/(e)/f',
      'c/f',
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
        includeGroupVariations: true,
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
        includeGroupVariations: true,
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
  it(`should get html files without group variation`, () => {
    expect(
      getHtmlFiles({
        includeGroupVariations: false,
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
      '(root)/(index)/index.html',
      '(root)/(index)/[...missing].html',
      '(root)/(index)/notifications.html',
    ]);

    expect(
      getHtmlFiles({
        includeGroupVariations: false,
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
      '_sitemap.html',
      '[...404].html',
      'alpha/index.html',
      '(app)/index.html',
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
    expect([
      // @ts-expect-error: downlevel iteration
      ...(
        await getFilesToExportFromServerAsync('/', {
          includeGroupVariations: true,
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
      ).keys(),
    ]).toEqual([
      'alpha/index.html',
      'alpha/second.html',
      '(app)/compose.html',
      'compose.html',
      '(app)/index.html',
      'index.html',
      '(app)/note/[note].html',
      'note/[note].html',
      '(auth)/sign-in.html',
      'sign-in.html',
      '_sitemap.html',
      '[...404].html',
    ]);
  });
});
