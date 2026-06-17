import { renderHook, act, type RenderHookOptions } from '@testing-library/react-native';

import { useLinkPreviewContext } from '../../../link/preview/LinkPreviewContext';
import type { NativeStackViewState } from '../../../react-navigation/native-stack';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../descriptors-context';
import { usePreviewTransition } from '../usePreviewTransition';

type HookProps = {
  state: NativeStackViewState;
  descriptors: NativeStackDescriptorMap;
};

jest.mock('../../../link/preview/LinkPreviewContext');

const mockUseLinkPreviewContext = useLinkPreviewContext as jest.Mock;

function makeRoute(key: string) {
  return { key, name: key, params: {} };
}

/**
 * Builds the projected state where preloaded routes are appended after `index`.
 */
function makeState(overrides: Partial<NativeStackViewState> = {}): NativeStackViewState {
  return {
    index: 0,
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

  it('intercepts transitionStart and promotes the preloaded preview screen', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    // The preloaded route is appended after the focused route
    const state = makeState({
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

    // After transitionStart, the preview screen becomes the focused route
    expect(result.current.computedState.routes).toHaveLength(2);
    expect(result.current.computedState.routes[1]!.key).toBe('preview-key');
    expect(result.current.computedState.index).toBe(1);

    // The descriptors already cover the preloaded route, so they pass through unchanged
    expect(result.current.computedDescriptors).toBe(descriptors);

    // Original emit should still have been called
    expect(navigation.emit).toHaveBeenCalledTimes(1);
  });

  it('moves a later preloaded route right after the focused one when promoting it', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    // Two preloaded routes; the previewed one is not directly after the focused route
    const state = makeState({
      routes: [makeRoute('index-key'), makeRoute('other-preloaded'), makeRoute('preview-key')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['index-key', 'other-preloaded', 'preview-key']);

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'preview-key',
        data: { closing: false },
      });
    });

    expect(result.current.computedState.routes.map((route) => route.key)).toEqual([
      'index-key',
      'preview-key',
      'other-preloaded',
    ]);
    expect(result.current.computedState.index).toBe(1);
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

  it('clears tracking when the transitioning screen becomes an active route', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState({
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

    // Verify synthesized state
    expect(result.current.computedState.index).toBe(1);

    // Now simulate React Navigation updating state to focus preview-key
    const updatedState = makeState({
      index: 1,
      routes: [makeRoute('index-key'), makeRoute('preview-key')],
    });
    const updatedDescriptors = makeDescriptors(['index-key', 'preview-key']);

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

  it('falls through to original state when no matching preloaded route exists', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'preview-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    // State has no preloaded route matching preview-key
    const state = makeState({
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

    // No matching preloaded route → should fall through to original state
    expect(result.current.computedState).toBe(state);
    expect(result.current.computedDescriptors).toBe(descriptors);
  });

  it('does not promote an already-active route', () => {
    mockUseLinkPreviewContext.mockReturnValue({
      isStackAnimationDisabled: true,
      openPreviewKey: 'index-key',
      setOpenPreviewKey: mockSetOpenPreviewKey,
    });

    const state = makeState({
      index: 1,
      routes: [makeRoute('other-key'), makeRoute('index-key'), makeRoute('preloaded-key')],
    });
    const navigation = makeNavigation();
    const descriptors = makeDescriptors(['other-key', 'index-key', 'preloaded-key']);

    const { result } = renderHook(() => usePreviewTransition(state, navigation, descriptors));

    act(() => {
      result.current.navigationWrapper.emit({
        type: 'transitionStart',
        target: 'index-key',
        data: { closing: false },
      });
    });

    // The route is already active (position <= index), so nothing is synthesized
    expect(result.current.computedState).toBe(state);
  });
});
