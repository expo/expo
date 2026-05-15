import type { UrlObject } from '../getRouteInfoFromState';
import { getRouteInfoFromState } from '../getRouteInfoFromState';
import {
  getCachedRouteInfo,
  setCachedRouteInfo,
  routeInfoSubscribers,
  routeInfoSubscribe,
} from '../routeInfoCache';
import type { ReactNavigationState } from '../types';

// Mock the getRouteInfoFromState module to avoid complex dependencies
jest.mock('../getRouteInfoFromState', () => ({
  getRouteInfoFromState: jest.fn(),
}));

const mockGetRouteInfoFromState = getRouteInfoFromState as jest.MockedFunction<
  typeof getRouteInfoFromState
>;

function makeUrlObject(overrides: Partial<UrlObject> = {}): UrlObject {
  return {
    unstable_globalHref: '/',
    pathname: '/',
    params: {},
    searchParams: new URLSearchParams(),
    segments: [],
    pathnameWithParams: '/',
    isIndex: false,
    ...overrides,
  };
}

function makeState(name: string): ReactNavigationState {
  return {
    routes: [{ key: `${name}-key`, name }],
    index: 0,
    key: `nav-${name}`,
    type: 'stack',
    routeNames: [name],
    stale: false,
  } as ReactNavigationState;
}

describe('getCachedRouteInfo', () => {
  beforeEach(() => {
    mockGetRouteInfoFromState.mockReset();
  });

  it('calls getRouteInfoFromState and returns the result', () => {
    const state = makeState('home');
    const routeInfo = makeUrlObject({ pathname: '/home', segments: ['home'] });
    mockGetRouteInfoFromState.mockReturnValue(routeInfo);

    const result = getCachedRouteInfo(state);

    expect(mockGetRouteInfoFromState).toHaveBeenCalledWith(state);
    expect(result.pathname).toBe('/home');
    expect(result.segments).toEqual(['home']);
  });

  it('caches by reference - same state object returns same result without re-calling', () => {
    const state = makeState('profile');
    const routeInfo = makeUrlObject({ pathname: '/profile' });
    mockGetRouteInfoFromState.mockReturnValue(routeInfo);

    const result1 = getCachedRouteInfo(state);
    const result2 = getCachedRouteInfo(state);

    // Should only call the underlying function once
    expect(mockGetRouteInfoFromState).toHaveBeenCalledTimes(1);
    // Should return the exact same reference
    expect(result1).toBe(result2);
  });

  it('deduplicates by value - different state objects producing same route info return same reference', () => {
    const state1 = makeState('settings');
    const state2 = makeState('settings-copy');

    // Both states produce identical route info (same JSON serialization)
    const routeInfo1 = makeUrlObject({ pathname: '/settings', segments: ['settings'] });
    const routeInfo2 = makeUrlObject({ pathname: '/settings', segments: ['settings'] });

    mockGetRouteInfoFromState.mockReturnValueOnce(routeInfo1).mockReturnValueOnce(routeInfo2);

    const result1 = getCachedRouteInfo(state1);
    const result2 = getCachedRouteInfo(state2);

    // Both should be called since they are different state objects
    expect(mockGetRouteInfoFromState).toHaveBeenCalledTimes(2);
    // But should return the same reference due to value deduplication
    expect(result1).toBe(result2);
  });

  it('returns different references for different route info values', () => {
    const state1 = makeState('home');
    const state2 = makeState('profile');

    const routeInfo1 = makeUrlObject({ pathname: '/home' });
    const routeInfo2 = makeUrlObject({ pathname: '/profile' });

    mockGetRouteInfoFromState.mockReturnValueOnce(routeInfo1).mockReturnValueOnce(routeInfo2);

    const result1 = getCachedRouteInfo(state1);
    const result2 = getCachedRouteInfo(state2);

    expect(result1).not.toBe(result2);
    expect(result1.pathname).toBe('/home');
    expect(result2.pathname).toBe('/profile');
  });
});

describe('setCachedRouteInfo', () => {
  beforeEach(() => {
    mockGetRouteInfoFromState.mockReset();
  });

  it('pre-populates the cache so getCachedRouteInfo does not call getRouteInfoFromState', () => {
    const state = makeState('cached');
    const routeInfo = makeUrlObject({ pathname: '/cached' });

    setCachedRouteInfo(state, routeInfo);

    const result = getCachedRouteInfo(state);

    // Should not call getRouteInfoFromState since it was pre-populated
    expect(mockGetRouteInfoFromState).not.toHaveBeenCalled();
    expect(result).toBe(routeInfo);
  });
});

describe('routeInfoSubscribe', () => {
  afterEach(() => {
    // Clean up any leftover subscribers
    routeInfoSubscribers.clear();
  });

  it('adds a subscriber to the set', () => {
    const callback = jest.fn();

    routeInfoSubscribe(callback);

    expect(routeInfoSubscribers.has(callback)).toBe(true);
  });

  it('returns an unsubscribe function that removes the callback', () => {
    const callback = jest.fn();

    const unsubscribe = routeInfoSubscribe(callback);
    expect(routeInfoSubscribers.has(callback)).toBe(true);

    unsubscribe();
    expect(routeInfoSubscribers.has(callback)).toBe(false);
  });

  it('supports multiple subscribers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    routeInfoSubscribe(callback1);
    routeInfoSubscribe(callback2);

    expect(routeInfoSubscribers.size).toBe(2);
    expect(routeInfoSubscribers.has(callback1)).toBe(true);
    expect(routeInfoSubscribers.has(callback2)).toBe(true);
  });

  it('only removes the specific subscriber when unsubscribe is called', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const unsub1 = routeInfoSubscribe(callback1);
    routeInfoSubscribe(callback2);

    unsub1();

    expect(routeInfoSubscribers.has(callback1)).toBe(false);
    expect(routeInfoSubscribers.has(callback2)).toBe(true);
  });

  it('is idempotent - calling unsubscribe multiple times is safe', () => {
    const callback = jest.fn();

    const unsubscribe = routeInfoSubscribe(callback);

    unsubscribe();
    unsubscribe(); // Should not throw

    expect(routeInfoSubscribers.has(callback)).toBe(false);
  });
});
