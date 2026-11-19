import type * as PerformanceModule from '..';

const pageDetail = { pathname: '/a', params: {}, segments: ['a'], screenId: 'a-1' };

let api: typeof PerformanceModule;

const originalMark = performance.mark;
let markSpy: jest.Mock;

beforeEach(() => {
  // jsdom has no `performance.mark`, so assign the spy directly.
  markSpy = jest.fn();
  performance.mark = markSpy;
  // Each test starts from a disabled integration.
  jest.isolateModules(() => {
    api = require('..');
  });
});

afterEach(() => {
  performance.mark = originalMark;
});

it('uses the global PerformanceObserver and performance', () => {
  expect(api.unstable_PerformanceObserver).toBe(globalThis.PerformanceObserver);
  expect(api.unstable_performance).toBe(globalThis.performance);
});

it('records nothing before unstable_enablePerformanceIntegration()', () => {
  api.mark('expo-router:page-focused', pageDetail);

  expect(markSpy).not.toHaveBeenCalled();
});

it('records marks with detail through the global performance.mark', () => {
  api.unstable_enablePerformanceIntegration();

  api.mark('expo-router:page-focused', pageDetail);

  expect(markSpy).toHaveBeenCalledWith('expo-router:page-focused', { detail: pageDetail });
});
