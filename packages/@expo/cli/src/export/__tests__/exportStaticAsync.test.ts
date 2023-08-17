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
        // NOTE: Revise this to support the `_route` so we can collect route file paths with output path
        manifest: {
          initialRouteName: undefined,
          screens: {
            alpha: {
              path: 'alpha',
              screens: {
                index: {
                  path: '',
                  _route: {
                    contextKey: './alpha/index.tsx',
                  },
                },
                second: {
                  path: 'second',
                  _route: {
                    contextKey: './alpha/second.tsx',
                  },
                },
              },
              initialRouteName: 'index',
              _route: {
                contextKey: './alpha/_layout.tsx',
              },
            },
            '(app)': {
              path: {
                path: '(app)',
                _route: {
                  contextKey: './(app)/_layout.tsx',
                },
              },
              screens: {
                compose: {
                  path: 'compose',
                  _route: {
                    contextKey: './(app)/compose.tsx',
                  },
                },
                index: {
                  path: '',
                  _route: {
                    contextKey: './(app)/index.tsx',
                  },
                },
                'note/[note]': {
                  path: 'note/:note',
                  _route: {
                    contextKey: './(app)/note/[note].tsx',
                  },
                },
              },
              initialRouteName: 'index',
            },
            '(auth)/sign-in': {
              path: '(auth)/sign-in',
              _route: {
                contextKey: './(auth)/sign-in.tsx',
              },
            },
            _sitemap: {
              path: '_sitemap',
              _route: {
                contextKey: './_sitemap.tsx',
              },
            },
            '[...404]': {
              path: '*404',
              _route: {
                contextKey: './[...404].tsx',
              },
            },
          },
        },
      }).sort((a, b) => a.length - b.length)
    ).toEqual([
      ['alpha/second.html', 'alpha/second.tsx'],
      ['[object Object]/compose.html', '(app)/compose.tsx'],
      ['[object Object]/note/[note].html', '(app)/note/[note].tsx'],
      ['(auth)/sign-in.html', '(auth)/sign-in.tsx'],
      ['sign-in.html', '(auth)/sign-in.tsx'],
      ['_sitemap.html', '_sitemap.tsx'],
      ['[...404].html', '[...404].tsx'],
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
              _route: {
                contextKey: './(root)/_layout.tsx',
              },
              screens: {
                '(index)': {
                  path: '(index)',
                  _route: {
                    contextKey: './(root)/(index)/_layout.tsx',
                  },
                  screens: {
                    '[...missing]': {
                      path: '*missing',
                      _route: {
                        contextKey: './(root)/(index)/[...missing].tsx',
                      },
                    },
                    index: {
                      path: '',
                      _route: {
                        contextKey: './(root)/(index)/index.tsx',
                      },
                    },
                    notifications: {
                      path: 'notifications',
                      _route: {
                        contextKey: './(root)/notifications.tsx',
                      },
                    },
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
      ['(root)/(index)/[...missing].html', '(root)/(index)/[...missing].tsx'],
      ['(index)/[...missing].html', '(root)/(index)/[...missing].tsx'],
      ['[...missing].html', '(root)/(index)/[...missing].tsx'],
      ['(root)/[...missing].html', '(root)/(index)/[...missing].tsx'],
      ['(root)/(index)/notifications.html', '(root)/notifications.tsx'],
      ['(index)/notifications.html', '(root)/notifications.tsx'],
      ['notifications.html', '(root)/notifications.tsx'],
      ['(root)/notifications.html', '(root)/notifications.tsx'],
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
