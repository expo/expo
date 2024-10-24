import { inMemoryContext } from '../../testing-library/context-stubs';
import requireContext from '../../testing-library/require-context-ponyfill';
import { getTypedRoutesDeclarationFile } from '../generate';
import { getWatchHandler } from '../index';

function getGeneratedRoutes(
  context: ReturnType<typeof inMemoryContext>,
  options: Parameters<typeof getGeneratedRoutesFromOutput>[1] = {}
) {
  return getGeneratedRoutesFromOutput(getTypedRoutesDeclarationFile(context), options);
}

function getGeneratedRoutesFromOutput(output: string, { stripQuery = true } = {}) {
  if (stripQuery) {
    output = output.replaceAll("${`?${string}` | `#${string}` | ''}", '');
  }

  return {
    href: output.match(/href:\s(.+);/)?.[1],
    hrefParams: output.match(/hrefParams:\s(.+);/)?.[1],
  };
}

it('basic single static route', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      index: () => null,
    })
  );

  expect(generated).toEqual({
    href: 'Router.RelativePathString | Router.ExternalPathString | `/` | `/_sitemap` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; }',
    hrefParams:
      '{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; }',
  });
});

it('hoisting with layouts and groups', () => {
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
    href: "Router.RelativePathString | Router.ExternalPathString | `/_sitemap` | `${'/(app)'}` | `` | `${'/(app)'}/tabs/one` | `/tabs/one` | `${'/(app)'}/tabs/two` | `/tabs/two` | `${'/(app)'}/tabs${'/(apple)' | '/(banana)'}/three` | `/tabs/three` | `${'/(app)'}/tabs${'/(apple)'}/three/apple` | `/tabs/three/apple` | `${'/(app)'}/tabs${'/(banana)'}/three/banana` | `/tabs/three/banana` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}` | ``; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/tabs/one` | `/tabs/one`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/tabs/two` | `/tabs/two`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/tabs${'/(apple)' | '/(banana)'}/three` | `/tabs/three`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/tabs${'/(apple)'}/three/apple` | `/tabs/three/apple`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/tabs${'/(banana)'}/three/banana` | `/tabs/three/banana`; params?: Router.UnknownInputParams; } | `${'/(app)'}/tabs${'/(apple)' | '/(banana)'}/three/${Router.SingleRoutePart<T>}` | `/tabs/three/${Router.SingleRoutePart<T>}` | { pathname: `${'/(app)'}/tabs${'/(apple)' | '/(banana)'}/three/[fruit]` | `/tabs/three/[fruit]`, params: Router.UnknownInputParams & { fruit: string | number; } }",
    hrefParams:
      "{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}` | ``; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/tabs/one` | `/tabs/one`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/tabs/two` | `/tabs/two`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/tabs${'/(apple)' | '/(banana)'}/three` | `/tabs/three`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/tabs${'/(apple)'}/three/apple` | `/tabs/three/apple`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/tabs${'/(banana)'}/three/banana` | `/tabs/three/banana`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/tabs${'/(apple)' | '/(banana)'}/three/[fruit]` | `/tabs/three/[fruit]`, params: Router.UnknownOutputParams & { fruit: string | number; } }",
  });
});

it('works with no routes', () => {
  const generated = getGeneratedRoutes(inMemoryContext({}));

  expect(generated).toEqual({
    href: 'Router.RelativePathString | Router.ExternalPathString | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams }',
    hrefParams:
      '{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams }',
  });
});

it('works with only layouts', () => {
  const generated = getGeneratedRoutes(inMemoryContext({ _layout: () => null }));

  expect(generated).toEqual({
    href: 'Router.RelativePathString | Router.ExternalPathString | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams }',
    hrefParams:
      '{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams }',
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
    href: 'Router.RelativePathString | Router.ExternalPathString | `/hello world` | `/_sitemap` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/hello world`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | `/${Router.SingleRoutePart<T>}` | `/${string}` | { pathname: `/[hello world]`, params: Router.UnknownInputParams & { hello world: string | number; } } | { pathname: `/[...hello world]`, params: Router.UnknownInputParams & { hello world: (string | number)[]; } }',
    hrefParams:
      '{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/hello world`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/[hello world]`, params: Router.UnknownOutputParams & { hello world: string | number; } } | { pathname: `/[...hello world]`, params: Router.UnknownOutputParams & { hello world: (string | number)[]; } }',
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
    href: "Router.RelativePathString | Router.ExternalPathString | `/_sitemap` | `${'/(a)' | '/(b)' | '/(c)'}/apple` | `/apple` | `${'/(a)' | '/(b)'}${'/(e)' | '/(f)'}/banana` | `/banana` | `/test${'/(red)' | '/(blue)'}` | `/test` | `/test${'/(red)' | '/(blue)'}/color` | `/test/color` | `/test${'/(red)' | '/(blue)'}/folder${'/(green)'}/page` | `/test/folder/page` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(a)' | '/(b)' | '/(c)'}/apple` | `/apple`; params?: Router.UnknownInputParams; } | { pathname: `${'/(a)' | '/(b)'}${'/(e)' | '/(f)'}/banana` | `/banana`; params?: Router.UnknownInputParams; } | { pathname: `/test${'/(red)' | '/(blue)'}` | `/test`; params?: Router.UnknownInputParams; } | { pathname: `/test${'/(red)' | '/(blue)'}/color` | `/test/color`; params?: Router.UnknownInputParams; } | { pathname: `/test${'/(red)' | '/(blue)'}/folder${'/(green)'}/page` | `/test/folder/page`; params?: Router.UnknownInputParams; }",
    hrefParams:
      "{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(a)' | '/(b)' | '/(c)'}/apple` | `/apple`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(a)' | '/(b)'}${'/(e)' | '/(f)'}/banana` | `/banana`; params?: Router.UnknownOutputParams; } | { pathname: `/test${'/(red)' | '/(blue)'}` | `/test`; params?: Router.UnknownOutputParams; } | { pathname: `/test${'/(red)' | '/(blue)'}/color` | `/test/color`; params?: Router.UnknownOutputParams; } | { pathname: `/test${'/(red)' | '/(blue)'}/folder${'/(green)'}/page` | `/test/folder/page`; params?: Router.UnknownOutputParams; }",
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

    expect(getGeneratedRoutesFromOutput(fn.mock.lastCall?.[0] ?? '')).toEqual({
      href: "Router.RelativePathString | Router.ExternalPathString | `/` | `/apple` | `/_sitemap` | `/fruit/banana` | `${'/(group)'}/foo` | `/foo` | `${'/(a)' | '/(b)'}/bar` | `/bar` | `${'/(a)' | '/(b)'}/directory${'/(c)' | '/(d)'}/route` | `/directory/route` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/apple`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/fruit/banana`; params?: Router.UnknownInputParams; } | { pathname: `${'/(group)'}/foo` | `/foo`; params?: Router.UnknownInputParams; } | { pathname: `${'/(a)' | '/(b)'}/bar` | `/bar`; params?: Router.UnknownInputParams; } | { pathname: `${'/(a)' | '/(b)'}/directory${'/(c)' | '/(d)'}/route` | `/directory/route`; params?: Router.UnknownInputParams; } | `/(a)/${Router.SingleRoutePart<T>}` | `/${Router.SingleRoutePart<T>}` | `${'/(a)' | '/(b)'}/directory${'/(c)' | '/(d)'}/${string}` | `/directory/${string}` | { pathname: `/(a)/[slug]` | `/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } } | { pathname: `${'/(a)' | '/(b)'}/directory${'/(c)' | '/(d)'}/[...catchall]` | `/directory/[...catchall]`, params: Router.UnknownInputParams & { catchall: (string | number)[]; } }",
      hrefParams:
        "{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/apple`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/fruit/banana`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(group)'}/foo` | `/foo`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(a)' | '/(b)'}/bar` | `/bar`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(a)' | '/(b)'}/directory${'/(c)' | '/(d)'}/route` | `/directory/route`; params?: Router.UnknownOutputParams; } | { pathname: `/(a)/[slug]` | `/[slug]`, params: Router.UnknownOutputParams & { slug: string | number; } } | { pathname: `${'/(a)' | '/(b)'}/directory${'/(c)' | '/(d)'}/[...catchall]` | `/directory/[...catchall]`, params: Router.UnknownOutputParams & { catchall: (string | number)[]; } }",
    });
  });

  it('can delete files', () => {
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/apple.ts`, type: 'add' });
    handler({ filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/fruit/banana.ts`, type: 'add' });
    handler({
      filePath: `${process.env.EXPO_ROUTER_APP_ROOT}/apple.ts`,
      type: 'delete',
    });

    expect(getGeneratedRoutesFromOutput(fn.mock.lastCall?.[0] ?? '')).toEqual({
      href: 'Router.RelativePathString | Router.ExternalPathString | `/` | `/_sitemap` | `/fruit/banana` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/fruit/banana`; params?: Router.UnknownInputParams; }',
      hrefParams:
        '{ pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/fruit/banana`; params?: Router.UnknownOutputParams; }',
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
    export interface __routes<T extends string | object = string> {
      hrefParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: \`/\`; params?: Router.UnknownOutputParams; } | { pathname: \`/apple\`; params?: Router.UnknownOutputParams; } | { pathname: \`/_sitemap\`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | \`/\${\`?\${string}\` | \`#\${string}\` | ''}\` | \`/apple\${\`?\${string}\` | \`#\${string}\` | ''}\` | \`/_sitemap\${\`?\${string}\` | \`#\${string}\` | ''}\` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: \`/\`; params?: Router.UnknownInputParams; } | { pathname: \`/apple\`; params?: Router.UnknownInputParams; } | { pathname: \`/_sitemap\`; params?: Router.UnknownInputParams; };
    }
  }
}
`);
  });
});
