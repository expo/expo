import { RouteNode } from '../Route';
import { generateDynamic } from '../getRoutes';
import { createGetIdForRoute } from '../useScreens';

function createMockRoute(routeName: string, contextKey: string, children: RouteNode[] = []) {
  return {
    dynamic: generateDynamic(routeName),
    route: routeName,
    children,
    contextKey,
  };
}

describe(createGetIdForRoute, () => {
  it(`returns the context string when the route is not dynamic and there are no search params`, () => {
    const getId = createGetIdForRoute(createMockRoute('foo', './foo.tsx'));
    expect(getId()).toBe('');
  });

  it(`should ignore search params`, () => {
    const getId = createGetIdForRoute(createMockRoute('foo', './foo.tsx'));
    expect(getId({ params: { foo: 'bar' } })).toBe('');
  });

  it(`returns a function that picks deep the dynamic name from params`, () => {
    const getId = createGetIdForRoute(createMockRoute('[...bacon]', './[...bacon].tsx'))!;
    expect(getId).toBeDefined();

    // // Matching param (ideal case)
    expect(getId({ params: { bacon: ['bacon', 'other'] } })).toBe('bacon/other');

    // With search parameters
    expect(getId({ params: { bar: 'foo' } })).toBe('[...bacon]');

    // Deep dynamic route
    expect(getId({ params: { bacon: ['foo', 'bar'] } })).toBe('foo/bar');
    expect(getId({ params: { bacon: ['foo'] } })).toBe('foo');

    // Should never happen, but just in case.
    expect(getId({ params: { bacon: [] } })).toBe('[...bacon]');
  });

  it(`returns a function that picks the dynamic name from params`, () => {
    const getId = createGetIdForRoute(createMockRoute('[user]', './[user].tsx'))!;
    expect(getId).toBeDefined();

    // Matching param (ideal case)
    expect(getId({ params: { user: 'bacon' } })).toBe('bacon');
    // With search parameters
    expect(getId({ params: { bar: 'foo' } })).toBe('[user]');
    // No params
    expect(getId({ params: undefined })).toBe('[user]');

    // Should never happen, but just in case.
    expect(getId({ params: { user: '' } })).toBe('[user]');
  });

  it(`returns a function that picks multiple dynamic names from params`, () => {
    const getId = createGetIdForRoute(createMockRoute('[user]/foo/[bar]', './[user]/foo/[bar]'))!;
    expect(getId).toBeDefined();

    expect(getId({ params: { user: 'bacon', bar: 'hey' } })).toBe('bacon/hey');
    // Fills partial params
    expect(getId({ params: { user: 'bacon' } })).toBe('bacon/[bar]');
    // With search parameters
    expect(getId({ params: { baz: 'foo' } })).toBe('[user]/[bar]');
    // No params
    expect(getId({ params: undefined })).toBe('[user]/[bar]');

    // Should never happen, but just in case.
    expect(getId({ params: { user: '' } })).toBe('[user]/[bar]');
  });

  it(`should not include search parameters if not a leaf RouterNode`, () => {
    const getId = createGetIdForRoute(
      createMockRoute('[user]', './[user]/_layout.tsx', [{} as RouteNode])
    )!;

    expect(getId({ params: { baz: 'foo' } })).toBe('[user]');
  });
});
