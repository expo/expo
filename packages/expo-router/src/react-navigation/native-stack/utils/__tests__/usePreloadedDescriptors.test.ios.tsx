import { renderHook } from '@testing-library/react-native';

import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../../types';
import { usePreloadedDescriptors } from '../usePreloadedDescriptors';

function makeRoute(key: string) {
  return { key, name: key, params: {} };
}

function makeDescriptor(key: string): NativeStackDescriptor {
  return {
    render: jest.fn(),
    options: {},
    route: makeRoute(key),
    navigation: {} as any,
  };
}

describe('usePreloadedDescriptors', () => {
  it('returns the descriptors unchanged when there are no preloaded routes', () => {
    const descriptors: NativeStackDescriptorMap = { 'route-1': makeDescriptor('route-1') };
    const describe = jest.fn();

    const { result } = renderHook(() => usePreloadedDescriptors([], descriptors, describe));

    expect(result.current).toBe(descriptors);
    expect(describe).not.toHaveBeenCalled();
  });

  it('describes preloaded routes and merges them into the map', () => {
    const descriptors: NativeStackDescriptorMap = { 'route-1': makeDescriptor('route-1') };
    const preloadedRoute = makeRoute('preloaded-1');
    const preloadedDescriptor = makeDescriptor('preloaded-1');
    const describe = jest.fn().mockReturnValue(preloadedDescriptor);

    const { result } = renderHook(() =>
      usePreloadedDescriptors([preloadedRoute], descriptors, describe)
    );

    expect(describe).toHaveBeenCalledWith(preloadedRoute, true);
    expect(result.current['preloaded-1']).toBe(preloadedDescriptor);
    expect(result.current['route-1']).toBe(descriptors['route-1']);
    // The input map is not mutated
    expect(descriptors['preloaded-1']).toBeUndefined();
  });

  it('keeps an existing descriptor instead of describing the route again', () => {
    const existingDescriptor = makeDescriptor('preloaded-1');
    const descriptors: NativeStackDescriptorMap = { 'preloaded-1': existingDescriptor };
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreloadedDescriptors([makeRoute('preloaded-1')], descriptors, describe)
    );

    expect(describe).not.toHaveBeenCalled();
    expect(result.current['preloaded-1']).toBe(existingDescriptor);
  });
});
