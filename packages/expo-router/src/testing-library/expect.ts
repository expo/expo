import matchers from 'expect/build/matchers';

matchers.customTesters = [];

expect.extend({
  toHavePathname(screen, expected) {
    return matchers.toEqual(screen.getPathname(), expected);
  },
  toHavePathnameWithParams(screen, expected) {
    return matchers.toEqual(screen.getPathnameWithParams(), expected);
  },
  toHaveSegments(screen, expected) {
    return matchers.toEqual(screen.getSegments(), expected);
  },
  toHaveSearchParams(screen, expected) {
    return matchers.toEqual(screen.getSearchParams(), expected);
  },
  toHaveRouterState(screen, expected) {
    return matchers.toEqual(screen.getRouterState(), expected);
  },
});
