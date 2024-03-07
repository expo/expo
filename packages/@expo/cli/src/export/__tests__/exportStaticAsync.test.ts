import { getMockConfig } from 'expo-router/build/testing-library/mock-config';

import {
  getHtmlFiles,
  getPathVariations,
  getFilesToExportFromServerAsync,
} from '../exportStaticAsync';

jest.mock('expo-router/build/views/Navigator', () => ({}));

jest.mock('react-native', () => ({}));
jest.mock('expo-linking', () => ({}));
jest.mock('expo-modules-core', () => ({}));
jest.mock('@react-navigation/native', () => ({}));

function Route() {
  return null;
}

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

        manifest: getMockConfig(
          {
            './alpha/_layout.tsx': {
              unstable_settings: { initialRouteName: 'index' },
              default: Route,
            },
            './alpha/index.tsx': Route,
            './alpha/second.tsx': Route,
            //
            './(app)/_layout.tsx': {
              unstable_settings: { initialRouteName: 'index' },
              default: Route,
            },
            './(app)/compose.tsx': Route,
            './(app)/index.tsx': Route,
            './(app)/note/[note].tsx': Route,
            //
            './(auth)/sign-in.js': Route,
            './_sitemap.tsx': Route,
            './[...404].tsx': Route,
          },
          false
        ),
      })
        .map((a) => a.filePath)
        .sort((a, b) => a.length - b.length)
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

  it(`should get html files with top-level array syntax`, () => {
    expect(
      getHtmlFiles({
        includeGroupVariations: true,

        manifest: getMockConfig(
          {
            './(a,b)/index.tsx': Route,
          },
          false
        ),
      })
        .map(({ filePath, pathname }) => ({ filePath, pathname }))
        .sort((a, b) => a.filePath.length - b.filePath.length)
    ).toEqual([
      { filePath: 'index.html', pathname: '' },
      { filePath: '(a)/index.html', pathname: '(a)' },
      { filePath: '(b)/index.html', pathname: '(b)' },
    ]);
  });
  it(`should get html files with nested array syntax`, () => {
    expect(
      getHtmlFiles({
        includeGroupVariations: true,
        manifest: getMockConfig(
          {
            './(a,b)/foo.tsx': Route,
          },
          false
        ),
      })
        .map(({ filePath, pathname }) => ({ filePath, pathname }))
        .sort((a, b) => a.filePath.length - b.filePath.length)
    ).toEqual([
      { filePath: 'foo.html', pathname: 'foo' },
      { filePath: '(a)/foo.html', pathname: '(a)/foo' },
      { filePath: '(b)/foo.html', pathname: '(b)/foo' },
    ]);
  });

  it(`should get html files 2`, () => {
    expect(
      getHtmlFiles({
        includeGroupVariations: true,

        manifest: getMockConfig(
          {
            './(root)/_layout.tsx': {
              unstable_settings: { initialRouteName: '(index)' },
              default: Route,
            },
            './(root)/(index)/_layout.tsx': {
              unstable_settings: { initialRouteName: 'index' },
              default: Route,
            },
            './(root)/(index)/index.tsx': Route,
            './(root)/(index)/[...missing].tsx': Route,
            './(root)/(index)/notifications.tsx': Route,
          },
          false
        ),
      })
        .map((a) => a.filePath)
        .sort((a, b) => a.length - b.length)
    ).toEqual([
      'index.html',
      '(root)/index.html',
      '[...missing].html',
      '(index)/index.html',
      'notifications.html',
      '(root)/[...missing].html',
      '(root)/(index)/index.html',
      '(index)/[...missing].html',
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
        manifest: getMockConfig(
          {
            './(root)/_layout.tsx': {
              unstable_settings: { initialRouteName: '(index)' },
              default: Route,
            },
            './(root)/(index)/_layout.tsx': {
              unstable_settings: { initialRouteName: 'index' },
              default: Route,
            },
            './(root)/(index)/index.tsx': Route,
            './(root)/(index)/[...missing].tsx': Route,
            './(root)/(index)/notifications.tsx': Route,
          },
          false
        ),
      })
        .map((a) => a.filePath)
        .sort((a, b) => a.length - b.length)
    ).toEqual([
      '(root)/(index)/index.html',
      '(root)/(index)/[...missing].html',
      '(root)/(index)/notifications.html',
    ]);

    expect(
      getHtmlFiles({
        includeGroupVariations: false,
        manifest: getMockConfig(
          {
            './alpha/_layout.tsx': {
              unstable_settings: { initialRouteName: 'index' },
              default: Route,
            },
            './alpha/index.tsx': Route,
            './alpha/second.tsx': Route,

            './(app)/_layout.tsx': {
              unstable_settings: { initialRouteName: 'index' },
              default: Route,
            },
            './(app)/compose.tsx': Route,
            './(app)/index.tsx': Route,
            './(app)/note/[note].tsx': Route,

            './(auth)/sign-in.js': Route,

            './_sitemap.tsx': Route,
            './[...404].tsx': Route,
          },
          false
        ),
      })
        .map((a) => a.filePath)
        .sort((a, b) => a.length - b.length)
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

    const files = await getFilesToExportFromServerAsync('/', {
      exportServer: false,
      manifest: getMockConfig(
        {
          './alpha/_layout.tsx': {
            unstable_settings: { initialRouteName: 'index' },
            default: Route,
          },
          './alpha/index.tsx': Route,
          './alpha/second.tsx': Route,

          './(app)/_layout.tsx': {
            unstable_settings: { initialRouteName: 'index' },
            default: Route,
          },
          './(app)/compose.tsx': Route,
          './(app)/index.tsx': Route,
          './(app)/note/[note].tsx': Route,

          './(auth)/sign-in.js': Route,

          './_sitemap.tsx': Route,
          './[...404].tsx': Route,
        },
        false
      ),
      renderAsync,
    });

    expect([...files.keys()].sort()).toEqual([
      '(app)/compose.html',
      '(app)/index.html',
      '(app)/note/[note].html',
      '(auth)/sign-in.html',
      '[...404].html',
      '_sitemap.html',
      'alpha/index.html',
      'alpha/second.html',
      'compose.html',
      'index.html',
      'note/[note].html',
      'sign-in.html',
    ]);

    expect([...files.values()].every((file) => file.targetDomain === 'client')).toBeTruthy();
  });

  it(`should export from server with array syntax`, async () => {
    const renderAsync = jest.fn(async () => '');

    const files = await getFilesToExportFromServerAsync('/', {
      exportServer: true,
      manifest: getMockConfig(
        {
          './(a,b)/multi-group.tsx': Route,
        },
        false
      ),
      renderAsync,
    });

    expect(renderAsync).toHaveBeenNthCalledWith(1, {
      filePath: '(a)/multi-group.html',
      pathname: '(a)/multi-group',
      route: expect.anything(),
    });
    expect(renderAsync).toHaveBeenNthCalledWith(2, {
      filePath: '(b)/multi-group.html',
      pathname: '(b)/multi-group',
      route: expect.anything(),
    });
    expect([...files.keys()]).toEqual(['(a)/multi-group.html', '(b)/multi-group.html']);

    expect([...files.values()].every((file) => file.targetDomain === 'server')).toBeTruthy();
  });

  it(`should export from server with top-level array syntax`, async () => {
    const renderAsync = jest.fn(async () => '');

    const files = await getFilesToExportFromServerAsync('/', {
      exportServer: true,
      manifest: getMockConfig(
        {
          './(a,b)/index.tsx': Route,
        },
        false
      ),
      renderAsync,
    });

    expect(renderAsync).toHaveBeenNthCalledWith(1, {
      filePath: '(a)/index.html',
      pathname: '(a)',
      route: expect.anything(),
    });

    expect([...files.keys()]).toEqual(['(a)/index.html', '(b)/index.html']);
  });
});
