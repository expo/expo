import { inMemoryContext } from '../../testing-library/context-stubs';
import requireContext from '../../testing-library/require-context-ponyfill';
import { getTypedRoutesDeclarationFile } from '../generate';
import { getWatchHandler } from '../index';

/**
 * Parsed the generated TypeScript definitions and returns the values of the
 * routes as arrays of strings
 */
export function getGeneratedRoutes(
  context: ReturnType<typeof inMemoryContext>,
  { stripStaticSuffix = true } = {}
) {
  const output = getTypedRoutesDeclarationFile(context);
  let staticRoutes = output.match(/StaticRoutes:\s(.+);/)?.[1];
  const dynamicRoutes = output.match(/DynamicRoutes:\s(.+);/)?.[1];
  const dynamicRouteTemplates = output.match(/DynamicRouteTemplate:\s(.+);/)?.[1];

  if (stripStaticSuffix) {
    staticRoutes = staticRoutes?.replaceAll("${`?${string}` | `#${string}` | ''}", '');
  }

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
    staticRoutes:
      '`/` | `/_sitemap` | { pathname: `/`; params?: UnknownInputParams | never; } | { pathname: `/_sitemap`; params?: UnknownInputParams | never; }',
    dynamicRoutes: undefined,
    dynamicRouteTemplates: undefined,
  });
});

it.only('hoisting with layouts and groups', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      '(app)/_layout': () => null,
      '(app)/index': () => null,
      '(app)/tabs/_layout': () => null,
      '(app)/tabs/one': () => null,
      '(app)/tabs/two': () => null,
      '(app)/tabs/(apple,banana)/three': () => null,
      '(app)/tabs/(apple)/three/apple': () => null,
      '(app)/tabs/(banana)/three/banana': () => null,
      '(app)/tabs/(apple,banana)/three/[fruit]': () => null,
    })
  );

  expect(generated).toEqual({
    staticRoutes:
      "`/_sitemap` | `${'/(app)' | ''}` | `${'/(app)' | ''}/tabs/one` | `${'/(app)' | ''}/tabs/two` | `${'/(app)' | ''}/tabs${'/(apple)' | '/(banana)' | ''}/three` | `${'/(app)' | ''}/tabs${'/(apple)' | ''}/three/apple` | `${'/(app)' | ''}/tabs${'/(banana)' | ''}/three/banana` | { pathname: `/_sitemap`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs/one`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs/two`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs${'/(apple)' | '/(banana)' | ''}/three`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs${'/(apple)' | ''}/three/apple`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs${'/(banana)' | ''}/three/banana`; params?: UnknownInputParams | never; }",
    dynamicRoutes:
      "`${'/(app)' | ''}/tabs${'/(apple)' | '/(banana)' | ''}/three/${Router.SingleRoutePart<T>}`",
    dynamicRouteTemplates:
      "{ pathname: `${'/(app)' | ''}/tabs${'/(apple)' | '/(banana)' | ''}/three/[fruit]`, params: Router.UnknownInputParams & { fruit: string | number; }",
  });
});

it('works with no routes', () => {
  const generated = getGeneratedRoutes(inMemoryContext({}));

  expect(generated).toEqual({
    dynamicRoutes: ['never'],
    dynamicRouteTemplates: ['never'],
    staticRoutes:
      "`/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(app)' | ''}${`?${string}` | `#${string}` | ''}` | `${'/(app)' | ''}/tabs/one${`?${string}` | `#${string}` | ''}` | `${'/(app)' | ''}/tabs/two${`?${string}` | `#${string}` | ''}` | `${'/(app)' | ''}/tabs${'/(apple)' | '/(banana)' | ''}/three${`?${string}` | `#${string}` | ''}` | `${'/(app)' | ''}/tabs${'/(apple)' | ''}/three/apple${`?${string}` | `#${string}` | ''}` | `${'/(app)' | ''}/tabs${'/(banana)' | ''}/three/banana${`?${string}` | `#${string}` | ''}` | { pathname: `/_sitemap`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs/one`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs/two`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs${'/(apple)' | '/(banana)' | ''}/three`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs${'/(apple)' | ''}/three/apple`; params?: UnknownInputParams | never; } | { pathname: `${'/(app)' | ''}/tabs${'/(banana)' | ''}/three/banana`; params?: UnknownInputParams | never; }",
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
      "${'/(a)' | '/(b)' | ''}${'/(e)' | '/(f)' | ''}/banana",
      "${'/(a)' | '/(b)' | '/(c)' | ''}/apple",
      '/_sitemap',
      "/test${'/(red)' | '/(blue)' | ''}",
      "/test${'/(red)' | '/(blue)' | ''}/color",
      "/test${'/(red)' | '/(blue)' | ''}/folder${'/(green)' | ''}/page",
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
      dynamicRouteTemplates: [
        "${'/(a)' | ''}/[slug]",
        "${'/(a)' | '/(b)' | ''}/directory${'/(c)' | '/(d)' | ''}/[...catchall]",
      ],
      dynamicRoutes: [
        "${'/(a)' | ''}/${Router.SingleRoutePart<T>}",
        "${'/(a)' | '/(b)' | ''}/directory${'/(c)' | '/(d)' | ''}/${string}",
      ],
      staticRoutes: [
        '/',
        "${'/(a)' | '/(b)' | ''}/bar",
        "${'/(a)' | '/(b)' | ''}/directory${'/(c)' | '/(d)' | ''}/route",
        "${'/(group)' | ''}/foo",
        '/_sitemap',
        '/apple',
        '/fruit/banana',
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
