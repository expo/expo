import matchers from "expect/build/matchers";

matchers.customTesters = [];

expect.extend({
  toHavePathname(screen, expected) {
    return matchers.toEqual(screen.getPathname(), expected);
  },
  toHaveSegments(screen, expected) {
    return matchers.toEqual(screen.getSegments(), expected);
  },
  toHaveSearchParams(screen, expected) {
    return matchers.toEqual(screen.getSearchParams(), expected);
  },
});
