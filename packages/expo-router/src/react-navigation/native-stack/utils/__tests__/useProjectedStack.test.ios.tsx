import { renderHook } from '@testing-library/react-native';

import type { ParamListBase, StackNavigationState } from '../../../native';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../../types';
import { useProjectedStack } from '../useProjectedStack';

function makeRoute(key: string) {
  return { key, name: key, params: {} };
}

function makeState(
  overrides: Partial<StackNavigationState<ParamListBase>> = {}
): StackNavigationState<ParamListBase> {
  return {
    stale: false,
    type: 'stack',
    key: 'stack-key',
    index: 0,
    routeNames: ['index'],
    routes: [makeRoute('route-1')],
    preloadedRoutes: [],
    ...overrides,
  };
}

function makeDescriptor(key: string): NativeStackDescriptor {
  return {
    render: jest.fn(),
    options: {},
    route: makeRoute(key),
    navigation: {} as any,
  };
}

describe('useProjectedStack', () => {
  it('keeps routes and descriptors as-is when there are no preloaded routes', () => {
    const state = makeState();
    const descriptors: NativeStackDescriptorMap = { 'route-1': makeDescriptor('route-1') };
    const describe = jest.fn();

    const { result } = renderHook(() => useProjectedStack(state, descriptors, describe));

    expect(result.current.projectedState.routes).toEqual(state.routes);
    expect(result.current.projectedState.index).toBe(state.index);
    expect(result.current.projectedDescriptors).toBe(descriptors);
    expect(describe).not.toHaveBeenCalled();
  });

  it('appends preloaded routes after the focused route and describes them', () => {
    const preloadedRoute = makeRoute('preloaded-1');
    const state = makeState({
      index: 1,
      routes: [makeRoute('route-1'), makeRoute('route-2')],
      preloadedRoutes: [preloadedRoute],
    });
    const descriptors: NativeStackDescriptorMap = {
      'route-1': makeDescriptor('route-1'),
      'route-2': makeDescriptor('route-2'),
    };
    const preloadedDescriptor = makeDescriptor('preloaded-1');
    const describe = jest.fn().mockReturnValue(preloadedDescriptor);

    const { result } = renderHook(() => useProjectedStack(state, descriptors, describe));

    // Preloaded routes land after `index`, which stays on the focused route
    expect(result.current.projectedState.routes.map((route) => route.key)).toEqual([
      'route-1',
      'route-2',
      'preloaded-1',
    ]);
    expect(result.current.projectedState.index).toBe(1);
    expect(result.current.projectedDescriptors['preloaded-1']).toBe(preloadedDescriptor);
    // The builder state is not mutated
    expect(state.routes).toHaveLength(2);
  });

  it('keeps a stable projected state across re-renders with the same state', () => {
    const state = makeState();
    const descriptors: NativeStackDescriptorMap = { 'route-1': makeDescriptor('route-1') };
    const describe = jest.fn();

    const { result, rerender } = renderHook(() => useProjectedStack(state, descriptors, describe));
    const firstProjectedState = result.current.projectedState;

    rerender({});
    expect(result.current.projectedState).toBe(firstProjectedState);
  });
});
