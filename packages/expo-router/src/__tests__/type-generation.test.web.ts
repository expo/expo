import { inMemoryContext } from '../testing-library/context-stubs';
import { getTypedRoutesDeclarationFile } from '../typed-routes/generate';

/**
 * Parsed the generated TypeScript definitions and returns the values of the
 * routes as arrays of strings
 */
export function getGeneratedRoutes(context: ReturnType<typeof inMemoryContext>) {
  const output = getTypedRoutesDeclarationFile(context);

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

//TODO: This should error
it('expands groups - invalid group syntax', () => {
  const generated = getGeneratedRoutes(inMemoryContext({ '(a,b,c)': () => null }));

  expect(generated).toEqual({
    staticRoutes: ['/(a)', '/(b)', '/(c)', '/_sitemap'],
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
      '/(a)/apple',
      '/(b)/apple',
      '/(c)/apple',
      '/(a)/(e,f)/banana', // TODO: This is a bug in getRoutes()
      '/(b)/(e,f)/banana',
      '/_sitemap',
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
