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

it('allows spaces in the filename', () => {
  const generated = getGeneratedRoutes(
    inMemoryContext({
      'hello world': () => null,
      '[hello world]': () => null,
      '[...hello world]': () => null,
    })
  );

  expect(generated).toEqual({
    staticRoutes: ['/hello world', '/_sitemap'],
    dynamicRoutes: ['/${SingleRoutePart<T>}', '/${CatchAllRoutePart<T>}'],
    dynamicRouteTemplates: ['/[hello world]', '/[...hello world]'],
  });
});

//TODO: This should error
it('expands groups - invalid group syntax', () => {
  const generated = getGeneratedRoutes(inMemoryContext({ '(a,b,c)/test': () => null }));

  expect(generated).toEqual({
    staticRoutes: ['/_sitemap', '/(a)/test', '/(b)/test', '/(c)/test'],
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
      '/_sitemap',
      '/(a)/apple',
      '/(a)/(e)/banana',
      '/(a)/(f)/banana',
      '/(b)/apple',
      '/(b)/(e)/banana',
      '/(b)/(f)/banana',
      '/(c)/apple',
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
