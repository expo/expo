import { renderHook } from '@testing-library/react-native';

import type { NavigationState } from '../../react-navigation/core';
import { useProjectedDescriptors } from '../useProjectedDescriptors';

function makeRoute(key: string) {
  return { key, name: key, params: {} };
}

function makeStackState(overrides: Partial<NavigationState> = {}): NavigationState {
  return {
    stale: false,
    key: 'stack-key',
    index: 0,
    routeNames: ['index'],
    routes: [makeRoute('route-1')],
    preloadedRoutes: [],
    ...overrides,
  } as unknown as NavigationState;
}

type TestDescriptor = { id: string };

describe('useProjectedDescriptors', () => {
  it('returns the descriptors unchanged when there are no preloaded routes', () => {
    const state = makeStackState();
    const descriptors: Record<string, TestDescriptor> = { 'route-1': { id: 'route-1' } };
    const describeRoute = jest.fn();

    const { result } = renderHook(() => useProjectedDescriptors(state, descriptors, describeRoute));

    expect(result.current).toBe(descriptors);
    expect(describeRoute).not.toHaveBeenCalled();
  });

  it('describes preloaded routes and merges them into the map', () => {
    const preloadedRoute = makeRoute('preloaded-1');
    const state = makeStackState({ preloadedRoutes: [preloadedRoute] } as Partial<NavigationState>);
    const descriptors: Record<string, TestDescriptor> = { 'route-1': { id: 'route-1' } };
    const preloadedDescriptor: TestDescriptor = { id: 'preloaded-1' };
    const describeRoute = jest.fn().mockReturnValue(preloadedDescriptor);

    const { result } = renderHook(() => useProjectedDescriptors(state, descriptors, describeRoute));

    expect(describeRoute).toHaveBeenCalledWith(preloadedRoute, true);
    expect(result.current['preloaded-1']).toBe(preloadedDescriptor);
    expect(result.current['route-1']).toBe(descriptors['route-1']);
    // The input map is not mutated
    expect(descriptors['preloaded-1']).toBeUndefined();
  });

  it('keeps an existing descriptor instead of describing the route again', () => {
    const state = makeStackState({
      preloadedRoutes: [makeRoute('preloaded-1')],
    } as Partial<NavigationState>);
    const existingDescriptor: TestDescriptor = { id: 'existing' };
    const descriptors: Record<string, TestDescriptor> = { 'preloaded-1': existingDescriptor };
    const describeRoute = jest.fn();

    const { result } = renderHook(() => useProjectedDescriptors(state, descriptors, describeRoute));

    expect(describeRoute).not.toHaveBeenCalled();
    expect(result.current['preloaded-1']).toBe(existingDescriptor);
  });
});
