import { renderHook, act, type RenderHookOptions } from '@testing-library/react-native';

import { useLinkPreviewContext } from '../../../link/preview/LinkPreviewContext';
import type { ParamListBase, StackNavigationState } from '../../../react-navigation/native';
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
    key: 'stack-1',
    index: 0,
    routeNames: ['index'],
    routes: [makeRoute('index-key')],
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

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    expect(result.current.computedState).toBe(state);
    expect(result.current.computedDescriptors).toBe(descriptors);
    expect(result.current.navigationWrapper).toBe(navigation);
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

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    // Navigation wrapper should be a new object, not the original
    expect(result.current.navigationWrapper).not.toBe(navigation);
    expect(result.current.navigationWrapper.emit).not.toBe(navigation.emit);
  });

  it('intercepts transitionStart and moves index to the preloaded screen', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState({
      index: 0,
      routes: [makeRoute('index-key'), makeRoute('preview-key')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key', 'preview-key']);

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    // Fire transitionStart for the preview key
    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // After transitionStart, `index` is moved to the (already present) preview screen.
    expect(result.current.computedState.routes).toHaveLength(2);
    expect(result.current.computedState.routes[1]!.key).toBe('preview-key');
    expect(result.current.computedState.index).toBe(1);
    expect(result.current.computedDescriptors).toBe(descriptors);

    // Original emit should still have been called
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('promotes only the previewed screen when multiple routes are preloaded', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    // Two preloaded screens in the inactive tail; the previewed one is NOT the first.
    const state = makeState({
      index: 0,
      routes: [makeRoute('index-key'), makeRoute('other-preload'), makeRoute('preview-key')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key', 'other-preload', 'preview-key']);

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // Only `preview-key` is promoted to the active top (index 1). `other-preload` must stay
    // inactive (position > index), not become active just because it sat before the previewed one.
    expect(result.current.computedState.index).toBe(1);
    expect(result.current.computedState.routes.map((r) => r.key)).toEqual([
      'index-key',
      'preview-key',
      'other-preload',
    ]);
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

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

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

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

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

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

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

  it('clears tracking when the preview screen becomes active', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState({
      index: 0,
      routes: [makeRoute('index-key'), makeRoute('preview-key')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key', 'preview-key']);

    const { result, rerender } = renderHook(
      ({ state, descriptors }: HookProps) => usePreviewTransition(state, navigation, descriptors),
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

    // While tracking, index is synthesized to the preview screen's position.
    expect(result.current.computedState.index).toBe(1);

    // Now React Navigation advances `index` to the preview screen (it becomes active).
    const updatedState = makeState({
      index: 1,
      routes: [makeRoute('index-key'), makeRoute('preview-key')],
    });

    rerender({ state: updatedState, descriptors });

    // Tracking is cleared, so the real state passes through directly.
    expect(result.current.computedState).toBe(updatedState);
    expect(result.current.computedDescriptors).toBe(descriptors);
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

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

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

    const { result, rerender } = renderHook(
      ({ state, descriptors }: HookProps) => usePreviewTransition(state, navigation, descriptors),
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

  it('falls through to original state when the preview screen is not in routes', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    // The tracked preview-key is not present in routes (only another preloaded route is).
    const state = makeState({
      index: 0,
      routes: [makeRoute('index-key'), makeRoute('other-preloaded')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key', 'other-preloaded']);

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    // Start tracking
    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    // preview-key is absent → fall through to original state
    expect(result.current.computedState).toBe(state);
    expect(result.current.computedDescriptors).toBe(descriptors);
  });
});
