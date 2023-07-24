import { generateDynamic } from '../getRoutes';
import { createGetIdForRoute } from '../useScreens';

function createMockRoute(routeName: string) {
  return {
    dynamic: generateDynamic(routeName),
    route: routeName,
  };
}

describe(createGetIdForRoute, () => {
  it(`returns undefined when the route is not dynamic`, () => {
    const getId = createGetIdForRoute(createMockRoute('foo'));
    expect(getId).toBeUndefined();
  });
  it(`returns a function that picks deep the dynamic name from params`, () => {
    const getId = createGetIdForRoute(createMockRoute('[...bacon]'))!;
    expect(getId).toBeDefined();

    // Matching param (ideal case)
    expect(getId({ params: { bacon: ['bacon', 'other'] } })).toBe('bacon/other');

    // Unmatching param
    expect(getId({ params: { bar: 'foo' } })).toBe('[...bacon]');

    // Deep dynamic route
    expect(getId({ params: { bacon: ['foo', 'bar'] } })).toBe('foo/bar');
    expect(getId({ params: { bacon: ['foo'] } })).toBe('foo');

    // Should never happen, but just in case.
    expect(getId({ params: { bacon: [] } })).toBe('[...bacon]');
  });

  it(`returns a function that picks the dynamic name from params`, () => {
    const getId = createGetIdForRoute(createMockRoute('[user]'))!;
    expect(getId).toBeDefined();

    // Matching param (ideal case)
    expect(getId({ params: { user: 'bacon' } })).toBe('bacon');
    // Unmatching param
    expect(getId({ params: { bar: 'foo' } })).toBe('[user]');
    // No params
    expect(getId({ params: undefined })).toBe('[user]');

    // Should never happen, but just in case.
    expect(getId({ params: { user: '' } })).toBe('[user]');
  });

  it(`returns a function that picks multiple dynamic names from params`, () => {
    const getId = createGetIdForRoute(createMockRoute('[user]/foo/[bar]'))!;
    expect(getId).toBeDefined();

    expect(getId({ params: { user: 'bacon', bar: 'hey' } })).toBe('bacon/hey');
    // Fills partial params
    expect(getId({ params: { user: 'bacon' } })).toBe('bacon/[bar]');
    // Unmatching param
    expect(getId({ params: { baz: 'foo' } })).toBe('[user]/[bar]');
    // No params
    expect(getId({ params: undefined })).toBe('[user]/[bar]');

    // Should never happen, but just in case.
    expect(getId({ params: { user: '' } })).toBe('[user]/[bar]');
  });
});
