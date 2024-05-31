import { inMemoryContext } from '../testing-library/context-stubs';
import requireContext from '../testing-library/require-context-ponyfill';
import { getWatchHandler } from '../typed-routes';
import { getTypedRoutesDeclarationFile } from '../typed-routes/generate';

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

  const staticRoutes = toArray(/type StaticRoutes = (.+);/);
  const dynamicRoutes = toArray(/type DynamicRoutes<T extends string> = (.+);/);
  const dynamicRouteTemplates = toArray(/type DynamicRouteTemplate = (.+);/);

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
    dynamicRoutes: ['/${CatchAllRoutePart<T>}', '/${SingleRoutePart<T>}'],
    dynamicRouteTemplates: ['/[...hello world]', '/[hello world]'],
  });
});

it('expands groups', () => {
  const generated = getGeneratedRoutes(inMemoryContext({ '(a,b,c)/test': () => null }));

  expect(generated).toEqual({
    staticRoutes: ['/(a)/test', '/(b)/test', '/(c)/test', '/_sitemap', '/test'],
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
  });
});

it('expands groups', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      '(a,b,c)/apple': () => null,
      '(a,b)/(e,f)/banana': () => null,
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
    ],
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
  });
});

/**
 * Miscellaneous tests to ensure that the generated routes are correct
 */
const routes = [
  ['[a]/index', '/${SingleRoutePart<T>}', '/[a]'],
  ['[a]/[b]', '/${SingleRoutePart<T>}/${SingleRoutePart<T>}', '/[a]/[b]'],
  ['static/[a]', '/static/${SingleRoutePart<T>}', '/static/[a]'],
  [
    'static/[a]/nested/[b]',
    '/static/${SingleRoutePart<T>}/nested/${SingleRoutePart<T>}',
    '/static/[a]/nested/[b]',
  ],
] as const;

it.each(routes)('dynamic route: ./%s', (route, dynamicRoute, dynamicRouteTemplates) => {
  const generated = getGeneratedRoutes(inMemoryContext({ [route]: () => null }));
  expect(generated).toEqual({
    staticRoutes: ['/_sitemap'],
    dynamicRoutes: [dynamicRoute],
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
      dynamicRoutes: [
        '/${SingleRoutePart<T>}',
        '/(a)/${SingleRoutePart<T>}',
        '/(a)/directory/${CatchAllRoutePart<T>}',
        '/(a)/directory/(c)/${CatchAllRoutePart<T>}',
        '/(a)/directory/(d)/${CatchAllRoutePart<T>}',
        '/(b)/directory/${CatchAllRoutePart<T>}',
        '/(b)/directory/(c)/${CatchAllRoutePart<T>}',
        '/(b)/directory/(d)/${CatchAllRoutePart<T>}',
        '/directory/${CatchAllRoutePart<T>}',
        '/directory/(c)/${CatchAllRoutePart<T>}',
        '/directory/(d)/${CatchAllRoutePart<T>}',
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
