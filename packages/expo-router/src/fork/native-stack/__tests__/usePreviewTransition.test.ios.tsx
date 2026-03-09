import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import { renderHook, act, type RenderHookOptions } from '@testing-library/react-native';

import { useLinkPreviewContext } from '../../../link/preview/LinkPreviewContext';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../descriptors-context';
import { usePreviewTransition } from '../usePreviewTransition';

type HookProps = {
  state: StackNavigationState<ParamListBase>;
  descriptors: NativeStackDescriptorMap;
};

jest.mock('../../../link/preview/LinkPreviewContext');

const mockUseLinkPreviewContext = useLinkPreviewContext as jest.Mock;

function makeRoute(key: string) {
  return { key, name: key, params: {} };
}

function makeState(
  overrides: Partial<StackNavigationState<ParamListBase>> = {}
): StackNavigationState<ParamListBase> {
  return {
    stale: false,
    type: 'stack',
    key: 'stack-1',
    index: 0,
    routeNames: ['index'],
    routes: [makeRoute('index-key')],
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

function makeDescriptors(keys: string[]): NativeStackDescriptorMap {
  const result: NativeStackDescriptorMap = {};
  for (const key of keys) {
    result[key] = makeDescriptor(key);
  }
  return result;
}

function makeNavigation() {
  return { emit: jest.fn((..._args: any[]) => ({ defaultPrevented: false })) };
}

describe('usePreviewTransition', () => {
  let mockSetOpenPreviewKey: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetOpenPreviewKey = jest.fn();
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: false,
      openPreviewKey: undefined,
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('passes through original state, descriptors, and navigation when no preview is active', () => {
    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    expect(result.current.computedState).toBe(state);
    expect(result.current.computedDescriptors).toBe(descriptors);
    expect(result.current.navigationWrapper).toBe(navigation);
    expect(describe).not.toHaveBeenCalled();
  });

  it('wraps navigation.emit when openPreviewKey is set', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    // Navigation wrapper should be a new object, not the original
    expect(result.current.navigationWrapper).not.toBe(navigation);
    expect(result.current.navigationWrapper.emit).not.toBe(navigation.emit);
  });

  it('intercepts transitionStart and starts tracking the preview screen', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const preloadedRoute = makeRoute('preview-key');
    const state = makeState({
      preloadedRoutes: [preloadedRoute],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const previewDescriptor = makeDescriptor('preview-key');
    const describe = jest.fn().mockReturnValue(previewDescriptor);

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    // Fire transitionStart for the preview key
    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // After transitionStart, the hook should synthesize state with the preloaded route
    expect(result.current.computedState.routes).toHaveLength(2);
    expect(result.current.computedState.routes[1].key).toBe('preview-key');
    expect(result.current.computedState.index).toBe(1);
    expect(result.current.computedState.preloadedRoutes).toHaveLength(0);

    // Should have called describe for the new descriptor
    expect(describe).toHaveBeenCalledWith(preloadedRoute, true);
    expect(result.current.computedDescriptors['preview-key']).toBe(previewDescriptor);

    // Original emit should still have been called
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('intercepts transitionEnd and calls setOpenPreviewKey(undefined)', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionEnd',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    expect(mockSetOpenPreviewKey).toHaveBeenCalledWith(undefined);
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('does not intercept events with closing: true', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: true },
      });
    });

    // State should remain unchanged - closing events are not intercepted
    expect(result.current.computedState).toBe(state);
    expect(mockSetOpenPreviewKey).not.toHaveBeenCalled();
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('does not intercept events for a different target', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'other-key',
        data: { closing: false },
      });
    });

    // State should remain unchanged - different target
    expect(result.current.computedState).toBe(state);
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('reuses existing descriptor when already present in descriptors map', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const preloadedRoute = makeRoute('preview-key');
    const existingPreviewDescriptor = makeDescriptor('preview-key');
    const state = makeState({
      preloadedRoutes: [preloadedRoute],
    });
    const navigation = makeNavigation();
    // Descriptors already include preview-key
    const descriptors = {
      ...makeDescriptors(['index-key']),
      'preview-key': existingPreviewDescriptor,
    };
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    // Fire transitionStart to begin tracking
    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // Should NOT call describe since descriptor already exists
    expect(describe).not.toHaveBeenCalled();
    // Should reuse the same descriptors object
    expect(result.current.computedDescriptors).toBe(descriptors);
  });

  it('clears tracking when state.routes includes the transitioning screen', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const preloadedRoute = makeRoute('preview-key');
    const state = makeState({
      preloadedRoutes: [preloadedRoute],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const previewDescriptor = makeDescriptor('preview-key');
    const describe = jest.fn().mockReturnValue(previewDescriptor);

    const { result, rerender } = renderHook(
      ({ state, descriptors }: HookProps) =>
        usePreviewTransition(state, navigation, descriptors, describe),
      { initialProps: { state, descriptors } as HookProps } as RenderHookOptions<HookProps>
    );

    // Start tracking
    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // Verify synthesized state
    expect(result.current.computedState.routes).toHaveLength(2);

    // Now simulate React Navigation updating state to include preview-key in routes
    const updatedState = makeState({
      index: 1,
      routes: [makeRoute('index-key'), makeRoute('preview-key')],
      preloadedRoutes: [],
    });
    const updatedDescriptors = {
      ...makeDescriptors(['index-key']),
      'preview-key': previewDescriptor,
    };

    rerender({ state: updatedState, descriptors: updatedDescriptors });

    // After state update, the hook should pass through the real state directly
    expect(result.current.computedState).toBe(updatedState);
    expect(result.current.computedDescriptors).toBe(updatedDescriptors);
  });

  it('passes through emit events with no data property', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
      });
    });

    // Without data property, the event should pass through without interception
    expect(result.current.computedState).toBe(state);
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('preserves navigationWrapper reference across re-renders when no preview is active', () => {
    const state = makeState();
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result, rerender } = renderHook(
      ({ state, descriptors }: HookProps) =>
        usePreviewTransition(state, navigation, descriptors, describe),
      { initialProps: { state, descriptors } as HookProps } as RenderHookOptions<HookProps>
    );

    const firstWrapper = result.current.navigationWrapper;
    expect(firstWrapper).toBe(navigation);

    // Rerender with new state/descriptors but no preview active
    const newState = makeState({ index: 0 });
    const newDescriptors = makeDescriptors(['index-key']);
    rerender({ state: newState, descriptors: newDescriptors });

    // navigationWrapper should still be the same navigation reference
    expect(result.current.navigationWrapper).toBe(navigation);
  });

  it('falls through to original state when no matching preloaded route exists', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    // State has no preloadedRoutes matching preview-key
    const state = makeState({
      preloadedRoutes: [makeRoute('other-preloaded')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key']);
    const describe = jest.fn();

    const { result } = renderHook(() =>
      usePreviewTransition(state, navigation, descriptors, describe)
    );

    // Start tracking
    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // No matching preloaded route → should fall through to original state
    expect(result.current.computedState).toBe(state);
    expect(result.current.computedDescriptors).toBe(descriptors);
    expect(describe).not.toHaveBeenCalled();
  });
});
