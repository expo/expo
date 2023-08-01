import { RouteNode, sortRoutes } from '../Route';
import { generateDynamic } from '../getRoutes';

const asRouteNode = (route: string) =>
  ({
    children: [],
    dynamic: generateDynamic(route),
    loadRoute(): any {
      return {
        default() {
          return null;
        },
      };
    },
    route,
    contextKey: 'INVALID_TEST_VALUE',
  } as RouteNode);

describe(sortRoutes, () => {
  it(`sorts index routes by priority`, () => {
    // Index before deep dynamic
    expect(sortRoutes(asRouteNode('index'), asRouteNode('[...a]'))).toBe(-1);
    // Index before dynamic
    expect(sortRoutes(asRouteNode('index'), asRouteNode('[a]'))).toBe(-1);
    // Index before named
    expect(sortRoutes(asRouteNode('index'), asRouteNode('a'))).toBe(-1);
    expect(sortRoutes(asRouteNode('index'), asRouteNode('z'))).toBe(-1);

    // Index tied with group
    expect(sortRoutes(asRouteNode('index'), asRouteNode('(z)'))).toBe(2);
  });
  it(`sorts group routes by priority`, () => {
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('[...a]'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('[a]'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('a'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('z'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('index'))).toBe(0);
  });
  it(`sorts multiple dynamic routes higher than a single deep dynamic route`, () => {
    // dynamic before deep dynamic
    expect(sortRoutes(asRouteNode('[a]/[b]'), asRouteNode('[...a]'))).toBe(-1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('[a]/[b]'))).toBe(1);
  });

  it(`sorts dynamic routes by priority`, () => {
    // dynamic before deep dynamic
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('[...a]'))).toBe(-1);
    // tied with two dynamic routes
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('[b]'))).toBe(0);
    expect(sortRoutes(asRouteNode('[a]/[b]'), asRouteNode('[b]/[a]'))).toBe(0);
    // Lower priority
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('index'))).toBe(1);
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('a'))).toBe(1);
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('(a)'))).toBe(1);
  });
  it(`sorts deep dynamic routes by priority`, () => {
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('[...beta]'))).toBe(0);
    expect(sortRoutes(asRouteNode('[...a]/[b]'), asRouteNode('[...beta]/[c]'))).toBe(0);
    // Lower priority
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('[b]'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]/[a]'), asRouteNode('[b]/[c]'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('index'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('a'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('(a)'))).toBe(1);
  });
});
