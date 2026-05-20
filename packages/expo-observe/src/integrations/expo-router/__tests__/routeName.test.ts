import { buildRoutePattern } from '../routeName';

describe('buildRoutePattern', () => {
  it('returns undefined when segments is undefined', () => {
    expect(buildRoutePattern(undefined)).toBeUndefined();
  });

  it.each([
    [[], '/'],
    [['(tabs)'], '/(tabs)'],
    [['(tabs)', '(home)'], '/(tabs)/(home)'],
    [['users', '[id]'], '/users/[id]'],
    [['files', '[...path]'], '/files/[...path]'],
    [['(tabs)', 'sessions', '[sessionId]'], '/(tabs)/sessions/[sessionId]'],
  ])('buildRoutePattern(%s) = %s', (segments, expected) => {
    expect(buildRoutePattern(segments as string[])).toBe(expected);
  });
});
