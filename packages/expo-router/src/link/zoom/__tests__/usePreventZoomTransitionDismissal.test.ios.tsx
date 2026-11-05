import { renderHook } from '@testing-library/react-native';
import type { ContextType, ReactNode } from 'react';

import { INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME } from '../../../navigationParams';
import { ScreenPresentationContext } from '../../../react-navigation/native-stack/utils/ScreenPresentationContext';
import { usePreventZoomTransitionDismissal } from '../usePreventZoomTransitionDismissal.ios';
import {
  ZoomTransitionTargetContext,
  type ZoomTransitionTargetContextValueType,
} from '../zoom-transition-context';

const mockSetOptions = jest.fn();
const mockIsFocused = jest.fn().mockReturnValue(true);
const mockRoute: { key: string; name: string; params: object; isPreloaded?: true } = {
  key: 'route-1',
  name: 'test',
  params: {},
};

jest.mock('../../../react-navigation/native', () => ({
  useRoute: jest.fn(() => mockRoute),
  useIsFocused: () => mockIsFocused(),
}));

jest.mock('../../../useNavigation', () => ({
  useNavigation: jest.fn(() => ({
    setOptions: mockSetOptions,
  })),
}));

function makeTargetContext(
  overrides: Partial<ZoomTransitionTargetContextValueType> = {}
): ZoomTransitionTargetContextValueType {
  return {
    identifier: 'source-123',
    setDismissalBoundsRect: jest.fn(),
    ...overrides,
  };
}

function renderPreventDismissal({
  presentation = 'card',
  targetContext = makeTargetContext(),
  options,
}: {
  presentation?: ContextType<typeof ScreenPresentationContext>;
  targetContext?: ZoomTransitionTargetContextValueType;
  options?: Parameters<typeof usePreventZoomTransitionDismissal>[0];
} = {}) {
  return renderHook(() => usePreventZoomTransitionDismissal(options), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ScreenPresentationContext value={presentation}>
        <ZoomTransitionTargetContext value={targetContext}>{children}</ZoomTransitionTargetContext>
      </ScreenPresentationContext>
    ),
  });
}

describe('usePreventZoomTransitionDismissal', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
    delete mockRoute.isPreloaded;
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('warns when used on a modal screen', async () => {
    const setDismissalBoundsRect = jest.fn();
    await renderPreventDismissal({
      presentation: 'modal',
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] usePreventZoomTransitionDismissal has no effect on screens presented modally. Please remove this hook from the screen component or change the screen presentation to a non-modal style.'
    );
    expect(setDismissalBoundsRect).not.toHaveBeenCalled();
  });

  it('does not warn on non-modal screen', async () => {
    await renderPreventDismissal();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('warns when minX >= maxX', async () => {
    await renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minX: 100, maxX: 50 },
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] unstable_dismissalBoundsRect: minX must be less than maxX'
    );
  });

  it('warns when minX equals maxX', async () => {
    await renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minX: 50, maxX: 50 },
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] unstable_dismissalBoundsRect: minX must be less than maxX'
    );
  });

  it('warns when minY >= maxY', async () => {
    await renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minY: 200, maxY: 100 },
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] unstable_dismissalBoundsRect: minY must be less than maxY'
    );
  });

  it('does not warn with valid rect', async () => {
    const setDismissalBoundsRect = jest.fn();
    await renderPreventDismissal({
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

  it('does not call setDismissalBoundsRect and setOptions without a zoom target', async () => {
    const setDismissalBoundsRect = jest.fn();
    await renderPreventDismissal({
      targetContext: makeTargetContext({ identifier: null, setDismissalBoundsRect }),
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200, minY: 10, maxY: 400 },
      },
    });

    expect(setDismissalBoundsRect).not.toHaveBeenCalled();
    expect(mockSetOptions).not.toHaveBeenCalled();
  });

  it('calls setOptions with `internal_gestureEnabled: false` when rect is provided', async () => {
    await renderPreventDismissal({
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200, minY: 10, maxY: 400 },
      },
    });

    expect(mockSetOptions).toHaveBeenCalledWith({
      [INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]: false,
    });
  });

  it('calls setOptions with `internal_gestureEnabled: undefined` when no rect and gesture enabled', async () => {
    await renderPreventDismissal();

    expect(mockSetOptions).toHaveBeenCalledWith({
      [INTERNAL_EXPO_ROUTER_GESTURE_ENABLED_OPTION_NAME]: undefined,
    });
  });

  it('does not update options for an unfocused preloaded route', async () => {
    mockRoute.isPreloaded = true;
    mockIsFocused.mockReturnValue(false);

    await renderPreventDismissal();

    expect(mockSetOptions).not.toHaveBeenCalled();
  });

  // maxX: 0, maxY: 0 is an impossible rect that effectively blocks all gestures
  it('calls setDismissalBoundsRect with { maxX: 0, maxY: 0 } when gestureEnabled is false without explicit rect', async () => {
    const setDismissalBoundsRect = jest.fn();
    await renderPreventDismissal({
      targetContext: makeTargetContext({ gestureEnabled: false, setDismissalBoundsRect }),
    });

    expect(setDismissalBoundsRect).toHaveBeenCalledWith({ maxX: 0, maxY: 0 });
  });

  it('accepts partial rect with only X bounds defined', async () => {
    const setDismissalBoundsRect = jest.fn();
    await renderPreventDismissal({
      targetContext: makeTargetContext({ setDismissalBoundsRect }),
      options: {
        unstable_dismissalBoundsRect: { minX: 10, maxX: 200 },
      },
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(setDismissalBoundsRect).toHaveBeenCalledWith({ minX: 10, maxX: 200 });
  });

  it('calls setDismissalBoundsRect with null on unmount', async () => {
    const setDismissalBoundsRect = jest.fn();
    const { unmount } = await renderPreventDismissal({
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
    await unmount();

    expect(setDismissalBoundsRect).toHaveBeenCalledWith(null);
  });
});
