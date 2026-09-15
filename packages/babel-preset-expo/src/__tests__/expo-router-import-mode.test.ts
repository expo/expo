import * as babel from '@babel/core';

import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

function transformImportMode(caller: Record<string, string | boolean>): string {
  const result = babel.transform(`export const mode = process.env.EXPO_ROUTER_IMPORT_MODE;`, {
    babelrc: false,
    presets: [preset],
    filename: '/app/index.js',
    compact: true,
    caller: getCaller({ name: 'metro', ...caller }),
  });
  return result!.code!;
}

describe('EXPO_ROUTER_IMPORT_MODE', () => {
  it('is synchronous when async routes are not requested', () => {
    expect(transformImportMode({ platform: 'web', isDev: false })).toMatch(/["']sync["']/);
  });

  it('is lazy for web production bundles with async routes', () => {
    expect(transformImportMode({ platform: 'web', isDev: false, asyncRoutes: true })).toMatch(
      /["']lazy["']/
    );
  });

  it.each(['ios', 'android'])(
    'is lazy for %s development bundles with async routes',
    (platform) => {
      expect(transformImportMode({ platform, isDev: true, asyncRoutes: true })).toMatch(
        /["']lazy["']/
      );
    }
  );

  // Production async routes are web-only: native production bundles are never split.
  it.each(['ios', 'android'])(
    'stays synchronous for %s production bundles even with async routes',
    (platform) => {
      expect(transformImportMode({ platform, isDev: false, asyncRoutes: true })).toMatch(
        /["']sync["']/
      );
    }
  );

  it('stays synchronous in server bundles', () => {
    expect(
      transformImportMode({
        platform: 'web',
        isDev: false,
        isServer: true,
        asyncRoutes: true,
      })
    ).toMatch(/["']sync["']/);
  });
});
