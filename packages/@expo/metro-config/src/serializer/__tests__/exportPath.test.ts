import { getChunkUrl, getExportPathForDependencyWithOptions } from '../exportPath';

it.each([
  ['', 'dist/a.js', '/dist/a.js'],
  ['/', '/dist/a.js', '/dist/a.js'],
  ['/sub/', '/dist/a.js', '/sub/dist/a.js'],
  ['/sub', 'dist/a.js', '/sub/dist/a.js'],
  ['https://cdn.example.com/sub/', '/dist/a.js', 'https://cdn.example.com/sub/dist/a.js'],
  ['./', 'dist/a.js', './dist/a.js'],
])('joins chunk URL %s and %s', (base, filename, expected) => {
  expect(getChunkUrl(base, filename)).toBe(expected);
});

describe(getExportPathForDependencyWithOptions, () => {
  it(`returns consistent local path`, () => {
    expect(
      getExportPathForDependencyWithOptions(
        {
          absolutePath:
            '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox/etc/external.tsx',
          data: {
            name: './etc/external',
            data: {
              asyncType: 'async',
              locs: [
                {
                  start: { line: 6, column: 14, index: 104 },
                  end: { line: 6, column: 38, index: 128 },
                },
              ],
              key: 'ABce1CIQXn2ftjEvEp/O1fQ9SzE=',
            },
          },
        }.absolutePath,
        {
          serverRoot: '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox',
          platform: 'web',
          src: 'xxx',
        }
      )
    ).toBe('_expo/static/js/web/external-f561aaf6ef0bf14d4208bb46a4ccb3ad.js');
  });
});
