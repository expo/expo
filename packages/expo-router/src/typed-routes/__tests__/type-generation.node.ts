import { inMemoryContext } from '../../testing-library/context-stubs';
import requireContext from '../../testing-library/require-context-ponyfill';
import { getTypedRoutesDeclarationFile } from '../generate';
import { getWatchHandler } from '../index';

/**
 * Parsed the generated TypeScript definitions and returns the values of the
 * routes as arrays of strings
 */
export function getGeneratedRoutes(context: ReturnType<typeof inMemoryContext>) {
  const output = getTypedRoutesDeclarationFile(context);
  return splitDeclarationFileIntoSections(output);
}

function splitDeclarationFileIntoSections(output: string) {
  function toArray(regex: RegExp) {
    const match = output.match(regex)?.[1];
    if (!match) return [];
    if (match === 'never') return ['never'];
    return match.slice(1, -1).split('` | `');
  }

  const staticRoutes = toArray(/StaticRoutes:\s(.+);/);
  const dynamicRoutes = toArray(/DynamicRoutes:\s(.+);/);
  const dynamicRouteTemplates = toArray(/DynamicRouteTemplate:\s(.+);/);

  return {
    staticRoutes,
    dynamicRoutes,
    dynamicRouteTemplates,
  };
}

it('basic single static route', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      index: () => null,
    })
  );

  expect(generated).toEqual({
    staticRoutes: ['/', '/_sitemap'],
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
  });
});

it('works with no routes', () => {
  const generated = getGeneratedRoutes(inMemoryContext({}));

  expect(generated).toEqual({
    staticRoutes: ['never'],
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
  });
});

it('works with only layouts', () => {
  const generated = getGeneratedRoutes(inMemoryContext({ _layout: () => null }));

  expect(generated).toEqual({
    staticRoutes: ['never'],
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
  });
});

it('allows spaces in the filename', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      'hello world': () => null,
      '[hello world]': () => null,
      '[...hello world]': () => null,
    })
  );

  expect(generated).toEqual({
    staticRoutes: ['/_sitemap', '/hello world'],
    dynamicRoutes: ['/${Router.SingleRoutePart<T>}', '/${string}'],
    dynamicRouteTemplates: ['/[...hello world]', '/[hello world]'],
  });
});

it('expands groups', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      '(a,b,c)/apple': () => null,
      '(a,b)/(e,f)/banana': () => null,
      'test/(red,blue)/index': () => null,
      'test/(red,blue)/color': () => null,
      'test/(red,blue)/folder/(green)/page': () => null,
    })
  );

  expect(generated).toEqual({
    staticRoutes: [
      '/(a)/(e)/banana',
      '/(a)/(f)/banana',
      '/(a)/apple',
      '/(a)/banana',
      '/(b)/(e)/banana',
      '/(b)/(f)/banana',
      '/(b)/apple',
      '/(b)/banana',
      '/(c)/apple',
      '/(e)/banana',
      '/(f)/banana',
      '/_sitemap',
      '/apple',
      '/banana',
      '/test',
      '/test/(blue)',
      '/test/(blue)/color',
      '/test/(blue)/folder/(green)/page',
      '/test/(blue)/folder/page',
      '/test/(red)',
      '/test/(red)/color',
      '/test/(red)/folder/(green)/page',
      '/test/(red)/folder/page',
      '/test/color',
      '/test/folder/(green)/page',
      '/test/folder/page',
    ],
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
  });
});

/**
 * Miscellaneous tests to ensure that the generated routes are correct
 */
const routes = [
  ['[a]/index', '/${Router.SingleRoutePart<T>}', '/[a]'],
  ['[a]/[b]', '/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}', '/[a]/[b]'],
  ['static/[a]', '/static/${Router.SingleRoutePart<T>}', '/static/[a]'],
  [
    'static/[a]/nested/[b]',
    '/static/${Router.SingleRoutePart<T>}/nested/${Router.SingleRoutePart<T>}',
    '/static/[a]/nested/[b]',
  ],
] as const;

it.each(routes)('dynamic route: ./%s', (route, dynamicRoutes, dynamicRouteTemplates) => {
  const generated = getGeneratedRoutes(inMemoryContext({ [route]: () => null }));
  expect(generated).toEqual({
    staticRoutes: ['/_sitemap'],
    dynamicRoutes: [dynamicRoutes],
    dynamicRouteTemplates: [dynamicRouteTemplates],
  });
});

describe(getWatchHandler, () => {
  const originalAppRoot = process.env.EXPO_ROUTER_APP_ROOT;
  let handler: ReturnType<typeof getWatchHandler>;
  const fn = jest.fn();

  beforeAll(() => {
    process.env.EXPO_ROUTER_APP_ROOT = '/User/expo/project/app';
  });
  afterAll(() => {
    process.env.EXPO_ROUTER_APP_ROOT = originalAppRoot;
  });

  beforeEach(() => {
    const ctx = requireContext('FAKE_INPUT', true, /\.[tj]sx?$/, {
      './index.ts': true,
    });
    handler = getWatchHandler('/User/expo/project/app', {
      ctx,
      regenerateFn: () => {
        fn(getTypedRoutesDeclarationFile(ctx));
      },
    });
  });

  it('can add files', () => {
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/apple.ts`, type: 'add' });
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/fruit/banana.ts`, type: 'add' });
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/(group)/foo.ts`, type: 'add' });
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/(a,b)/bar.ts`, type: 'add' });
    handler({
      filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/(a,b)/directory/(c,d)/route.ts`,
      type: 'add',
    });

    handler({
      filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/(a)/[slug]`,
      type: 'add',
    });

    handler({
      filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/(a,b)/directory/(c,d)/[...catchall]`,
      type: 'add',
    });

    const sections = splitDeclarationFileIntoSections(fn.mock.lastCall?.[0] ?? '');

    expect(sections).toEqual({
      staticRoutes: [
        '/',
        '/(a)/bar',
        '/(a)/directory/(c)/route',
        '/(a)/directory/(d)/route',
        '/(a)/directory/route',
        '/(b)/bar',
        '/(b)/directory/(c)/route',
        '/(b)/directory/(d)/route',
        '/(b)/directory/route',
        '/(group)/foo',
        '/_sitemap',
        '/apple',
        '/bar',
        '/directory/(c)/route',
        '/directory/(d)/route',
        '/directory/route',
        '/foo',
        '/fruit/banana',
      ],
      dynamicRoutes: [
        '/${Router.SingleRoutePart<T>}',
        '/(a)/${Router.SingleRoutePart<T>}',
        '/(a)/directory/${string}',
        '/(a)/directory/(c)/${string}',
        '/(a)/directory/(d)/${string}',
        '/(b)/directory/${string}',
        '/(b)/directory/(c)/${string}',
        '/(b)/directory/(d)/${string}',
        '/directory/${string}',
        '/directory/(c)/${string}',
        '/directory/(d)/${string}',
      ],
      dynamicRouteTemplates: [
        '/(a)/[slug]',
        '/(a)/directory/(c)/[...catchall]',
        '/(a)/directory/(d)/[...catchall]',
        '/(a)/directory/[...catchall]',
        '/(b)/directory/(c)/[...catchall]',
        '/(b)/directory/(d)/[...catchall]',
        '/(b)/directory/[...catchall]',
        '/[slug]',
        '/directory/(c)/[...catchall]',
        '/directory/(d)/[...catchall]',
        '/directory/[...catchall]',
      ],
    });
  });

  it('can delete files', () => {
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/apple.ts`, type: 'add' });
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/fruit/banana.ts`, type: 'add' });
    handler({
      filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/apple.ts`,
      type: 'delete',
    });

    const sections = splitDeclarationFileIntoSections(fn.mock.lastCall?.[0] ?? '');

    expect(sections).toEqual({
      staticRoutes: ['/', '/_sitemap', '/fruit/banana'],
      dynamicRoutes: ['never'],
      dynamicRouteTemplates: ['never'],
    });
  });

  it('will ignore files outside the app dir', () => {
    handler({ filePath: `/other-directory/apple.ts`, type: 'add' });

    expect(fn).not.toHaveBeenCalled();
  });
});

describe(getTypedRoutesDeclarationFile, () => {
  it('can generate a file with the correct template', () => {
    const context = requireContext('FAKE_INPUT', true, /\.[tj]sx?$/, {
      './index.ts': true,
      './apple.ts': true,
    });

    const output = getTypedRoutesDeclarationFile(context);

    expect(output).toEqual(`/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: \`/\` | \`/_sitemap\` | \`/apple\`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
`);
  });
});
