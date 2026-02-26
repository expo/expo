import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type {
  NativeStackDescriptor,
  NativeStackDescriptorMap,
} from '../../../fork/native-stack/descriptors-context';
import { DescriptorsContext } from '../../../fork/native-stack/descriptors-context';
import { INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME } from '../../../navigationParams';
import { usePreventZoomTransitionDismissal } from '../usePreventZoomTransitionDismissal.ios';
import {
  ZoomTransitionTargetContext,
  type ZoomTransitionTargetContextValueType,
} from '../zoom-transition-context';

const mockSetOptions = jest.fn();
const mockIsFocused = jest.fn().mockReturnValue(true);
const mockGetState = jest.fn().mockReturnValue({ type: 'stack', preloadedRoutes: [] });

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(() => ({ key: 'route-1', name: 'test', params: {} })),
}));

jest.mock('../../../useNavigation', () => ({
  useNavigation: jest.fn(() => ({
    isFocused: mockIsFocused,
    getState: mockGetState,
    setOptions: mockSetOptions,
  })),
}));

jest.mock('../../../utils/stack', () => ({
  isRoutePreloadedInStack: jest.fn(() => false),
}));

function makeDescriptors(
  routeKey: string,
  options: Record<string, unknown> = {}
): NativeStackDescriptorMap {
  return {
    [routeKey]: { options } as NativeStackDescriptor,
  };
}

function makeTargetContext(
  overrides: Partial<ZoomTransitionTargetContextValueType> = {}
): ZoomTransitionTargetContextValueType {
  return {
    identifier: 'source-123',
    dismissalBoundsRect: null,
    setDismissalBoundsRect: jest.fn(),
    addEnabler: jest.fn(),
    removeEnabler: jest.fn(),
    hasEnabler: true,
    ...overrides,
  };
}

function renderPreventDismissal({
  descriptors = makeDescriptors('route-1'),
  targetContext = makeTargetContext(),
  options,
}: {
  descriptors?: NativeStackDescriptorMap;
  targetContext?: ZoomTransitionTargetContextValueType;
  options?: Parameters<typeof usePreventZoomTransitionDismissal>[0];
} = {}) {
  return renderHook(() => usePreventZoomTransitionDismissal(options), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <DescriptorsContext value={descriptors}>
        <ZoomTransitionTargetContext value={targetContext}>{children}</ZoomTransitionTargetContext>
      </DescriptorsContext>
    ),
  });
}

describe('usePreventZoomTransitionDismissal', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
    mockGetState.mockReturnValue({ type: 'stack', preloadedRoutes: [] });
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('warns when used on a modal screen', () => {
    const setDismissalBoundsRect = jest.fn();
    renderPreventDismissal({
      descriptors: makeDescriptors('route-1', { presentation: 'modal' }),
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] usePreventZoomTransitionDismissal has no effect on screens presented modally. Please remove this hook from the screen component or change the screen presentation to a non-modal style.'
    );
    expect(setDismissalBoundsRect).not.toHaveBeenCalled();
  });

  it('does not warn on non-modal screen', () => {
    renderPreventDismissal({
      descriptors: makeDescriptors('route-1'),
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('warns when minX >= maxX', () => {
    renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minX: 100, maxX: 50 },
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] unstable_dismissalBoundsRect: minX must be less than maxX'
    );
  });

  it('warns when minX equals maxX', () => {
    renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minX: 50, maxX: 50 },
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] unstable_dismissalBoundsRect: minX must be less than maxX'
    );
  });

  it('warns when minY >= maxY', () => {
    renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minY: 200, maxY: 100 },
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] unstable_dismissalBoundsRect: minY must be less than maxY'
    );
  });

  it('does not warn with valid rect', () => {
    const setDismissalBoundsRect = jest.fn();
    renderPreventDismissal({
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200, minY: 10, maxY: 400 },
      },
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(setDismissalBoundsRect).toHaveBeenCalledWith({
      minX: 10,
      maxX: 200,
      minY: 10,
      maxY: 400,
    });
  });

  it('does not call setDismissalBoundsRect and setOptions when hasEnabler is false', () => {
    const setDismissalBoundsRect = jest.fn();
    renderPreventDismissal({
      targetContext: makeTargetContext({ hasEnabler: false, setDismissalBoundsRect }),
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200, minY: 10, maxY: 400 },
      },
    });

    expect(setDismissalBoundsRect).not.toHaveBeenCalled();
    expect(mockSetOptions).not.toHaveBeenCalled();
  });

  it('calls setOptions with `internal_gestureEnabled: false` when rect is provided', () => {
    renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200, minY: 10, maxY: 400 },
      },
    });

    expect(mockSetOptions).toHaveBeenCalledWith({
      [INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]: false,
    });
  });

  it('calls setOptions with `internal_gestureEnabled: undefined` when no rect and gesture enabled', () => {
    renderPreventDismissal();

    expect(mockSetOptions).toHaveBeenCalledWith({
      [INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]: undefined,
    });
  });

  // maxX: 0, maxY: 0 is an impossible rect that effectively blocks all gestures
  it('calls setDismissalBoundsRect with { maxX: 0, maxY: 0 } when gestureEnabled is false without explicit rect', () => {
    const setDismissalBoundsRect = jest.fn();
    renderPreventDismissal({
      descriptors: makeDescriptors('route-1', { gestureEnabled: false }),
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
    });

    expect(setDismissalBoundsRect).toHaveBeenCalledWith({ maxX: 0, maxY: 0 });
  });

  it('accepts partial rect with only X bounds defined', () => {
    const setDismissalBoundsRect = jest.fn();
    renderPreventDismissal({
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200 },
      },
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(setDismissalBoundsRect).toHaveBeenCalledWith({ minX: 10, maxX: 200 });
  });

  it('calls setDismissalBoundsRect with null on unmount', () => {
    const setDismissalBoundsRect = jest.fn();
    const { unmount } = renderPreventDismissal({
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200, minY: 10, maxY: 400 },
      },
    });

    // First call is with the rect
    expect(setDismissalBoundsRect).toHaveBeenCalledWith({
      minX: 10,
      maxX: 200,
      minY: 10,
      maxY: 400,
    });

    setDismissalBoundsRect.mockClear();
    unmount();

    expect(setDismissalBoundsRect).toHaveBeenCalledWith(null);
  });
});
