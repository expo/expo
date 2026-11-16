import { afterEach, beforeEach, expect, jest } from '@jest/globals';

import type { NavigationState } from '../../../routers';

export function createTestState(
  routeNames: string[],
  nestedRouteNames: Record<string, string[]> = {}
): NavigationState {
  const routes = routeNames
    .filter((name, index) => index === 0 || nestedRouteNames[name])
    .map((name, index) => {
      const children = nestedRouteNames[name];

      return {
        key: index === 0 ? `${name}:0` : `${name}:0-0`,
        name,
        ...(children
          ? {
              state: {
                stale: false,
                routeKeySeq: 0,
                key: `nested-${name}`,
                index: 0,
                routeNames: children,
                routes: children.map((child) => ({ key: `${child}-${name}`, name: child })),
              },
            }
          : null),
      };
    });

  return {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames,
    routes,
  };
}

export const initialState = createTestState(['A', 'B']);
export const nestedInitialState = createTestState(['A', 'B'], { A: ['C'], B: ['C'] });

export function expectNoUnexpectedWarnings(allowedWarnings: string[] = []) {
  let warn: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(warn.mock.calls.filter(([message]) => !allowedWarnings.includes(String(message)))).toEqual(
      []
    );
    warn.mockRestore();
  });
}
