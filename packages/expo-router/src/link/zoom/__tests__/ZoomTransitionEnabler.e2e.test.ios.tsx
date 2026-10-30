import { act, fireEvent, screen } from '@testing-library/react-native';
import { use, useEffect, useState, type ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { internalNavigationEvents } from '../../../global-state/internalNavigationEvents';
import { router } from '../../../imperative-api';
import Stack from '../../../layouts/Stack';
import { useRoute } from '../../../react-navigation/native';
import { renderRouter } from '../../../testing-library';
import { Pressable } from '../../../views/Pressable';
import { Link } from '../../Link';
import { usePreventZoomTransitionDismissal } from '../usePreventZoomTransitionDismissal';
import { ZoomTransitionTargetContext } from '../zoom-transition-context';

jest.mock('react-native-screens', () => {
  const actualScreens: typeof import('react-native-screens') =
    jest.requireActual('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props: ComponentProps<typeof _ScreenStackItem>) => (
      <actualScreens.ScreenStackItem {...props} />
    )),
  };
});

const MockedScreenStackItem = jest.mocked(_ScreenStackItem);

jest.mock('../../preview/native', () => {
  const { View } = require('react-native');
  return {
    NativeLinkPreview: jest.fn(({ children }) => (
      <View testID="link-preview-native-view">{children}</View>
    )),
    NativeLinkPreviewContent: jest.fn(({ children }) => (
      <View testID="link-preview-native-preview-view">{children}</View>
    )),
    NativeLinkPreviewAction: jest.fn(({ children }) => (
      <View testID="link-preview-native-action-view">{children}</View>
    )),
    LinkZoomTransitionSource: jest.fn(({ children }) => (
      <View testID="link-zoom-transition-source">{children}</View>
    )),
    LinkZoomTransitionAlignmentRectDetector: jest.fn(({ children }) => (
      <View testID="link-zoom-transition-alignment-rect-detector">{children}</View>
    )),
    LinkZoomTransitionEnabler: jest.fn(() => null),
  };
});

jest.mock('../zoom-transition-enabled', () => {
  const originalModule = jest.requireActual(
    '../zoom-transition-enabled'
  ) as typeof import('../zoom-transition-enabled');
  return {
    ...originalModule,
    isZoomTransitionEnabled: () => true,
  };
});

const { LinkZoomTransitionEnabler: MockedLinkZoomTransitionEnabler } = jest.requireMock(
  '../../preview/native'
) as jest.Mocked<typeof import('../../preview/native')>;

async function navigateViaZoomLink() {
  const trigger = screen.getByTestId('zoom-link');
  await act(() => fireEvent.press(trigger));
  expect(screen.getByTestId('dest-page')).toBeVisible();
}

/** Returns the last dismissalBoundsRect passed to the native enabler component */
function getLastDismissalBoundsRect() {
  const callCount = MockedLinkZoomTransitionEnabler.mock.calls.length;
  if (callCount === 0) return undefined;
  return MockedLinkZoomTransitionEnabler.mock.calls[callCount - 1]![0].dismissalBoundsRect;
}

function IndexWithZoomLink() {
  return (
    <View testID="index-page">
      <Link href="/dest" asChild>
        <Link.AppleZoom>
          <Pressable testID="zoom-link">
            <Text>Go</Text>
          </Pressable>
        </Link.AppleZoom>
      </Link>
    </View>
  );
}

describe('ZoomTransitionEnabler with gestureEnabled', () => {
  beforeEach(() => {
    MockedLinkZoomTransitionEnabler.mockClear();
  });

  it('allows dismissal gesture when no gestureEnabled is set', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: IndexWithZoomLink,
      dest: () => <View testID="dest-page" />,
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toBeNull();
  });

  it('blocks dismissal gesture when gestureEnabled: false is set in Stack screenOptions', async () => {
    await renderRouter({
      _layout: () => <Stack screenOptions={{ gestureEnabled: false }} />,
      index: IndexWithZoomLink,
      dest: () => <View testID="dest-page" />,
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('blocks dismissal gesture when gestureEnabled: false is set in Stack.Screen options', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ gestureEnabled: false }} />
        </Stack>
      ),
      index: IndexWithZoomLink,
      dest: () => <View testID="dest-page" />,
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('blocks dismissal gesture on render when gestureEnabled: false is set via Stack.Screen inside page', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: IndexWithZoomLink,
      dest: () => (
        <View testID="dest-page">
          <Stack.Screen options={{ gestureEnabled: false }} />
        </View>
      ),
    });

    expect(screen.getByTestId('index-page')).toBeVisible();
    await navigateViaZoomLink();
    // Since we are getting the last dismissalBoundsRect this assertion is true
    // However there will be an initial render with null dismissalBoundsRect before the options take effect
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('can dynamically block dismissal gesture with gestureEnabled set via Stack.Screen inside page', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: IndexWithZoomLink,
      dest: function DestScreen() {
        const [gestureEnabled, setGestureEnabled] = useState(true);
        return (
          <View testID="dest-page">
            <Stack.Screen options={{ gestureEnabled }} />
            <Pressable
              testID="toggle-gesture-button"
              onPress={() => setGestureEnabled(!gestureEnabled)}>
              <Text>Toggle Gesture</Text>
            </Pressable>
          </View>
        );
      },
    });

    expect(screen.getByTestId('index-page')).toBeVisible();
    await navigateViaZoomLink();
    // Since we are getting the last dismissalBoundsRect this assertion is true
    // However there will be an initial render with null dismissalBoundsRect before the options take effect
    expect(getLastDismissalBoundsRect()).toBeNull();

    const toggleButton = screen.getByTestId('toggle-gesture-button');
    await act(() => fireEvent.press(toggleButton));
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });

    await act(() => fireEvent.press(toggleButton));
    expect(getLastDismissalBoundsRect()).toBeNull();
  });
});

async function navigateViaPreviewZoomLink() {
  // Native reports the key of the mounted preload, not an arbitrary preview ID.
  let previewKey: string | undefined;
  const unsubscribe = internalNavigationEvents.addListener('routePreloaded', ({ routeKey }) => {
    previewKey = routeKey;
  });
  await act(() => router.prefetch('/dest'));
  unsubscribe();
  expect(previewKey).toBeDefined();
  await act(() =>
    router.navigate(
      {
        pathname: '/dest',
        params: {
          __internal_expo_router_zoom_transition_source_id: 'preview-source',
        },
      },
      { __internal__PreviewKey: previewKey }
    )
  );
  expect(screen.getByTestId('dest-page')).toBeVisible();
}

it('does not provide a zoom target for a preview navigation to a card', async () => {
  const onIdentifier = jest.fn();

  function Destination() {
    onIdentifier(use(ZoomTransitionTargetContext).identifier);
    usePreventZoomTransitionDismissal({
      unstable_dismissalBoundsRect: { minX: 10, maxX: 200 },
    });
    return (
      <View testID="dest-page">
        <Link.AppleZoomTarget>
          <View testID="zoom-target-child" />
        </Link.AppleZoomTarget>
      </View>
    );
  }

  await renderRouter({
    _layout: () => <Stack />,
    index: () => <View testID="index-page" />,
    dest: Destination,
  });

  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    await navigateViaPreviewZoomLink();
    expect(onIdentifier).toHaveBeenLastCalledWith(null);
    expect(screen.getByTestId('zoom-target-child')).toBeVisible();
    expect(screen.queryByTestId('link-zoom-transition-alignment-rect-detector')).toBeNull();
  } finally {
    consoleWarnSpy.mockRestore();
  }
});

describe('zoom target context', () => {
  beforeEach(() => {
    MockedLinkZoomTransitionEnabler.mockClear();
  });

  it('provides the source identifier in a zoom destination', async () => {
    const onIdentifier = jest.fn();

    function Destination() {
      onIdentifier(use(ZoomTransitionTargetContext).identifier);
      return <View testID="dest-page" />;
    }

    await renderRouter({
      _layout: () => <Stack />,
      index: IndexWithZoomLink,
      dest: Destination,
    });

    await navigateViaZoomLink();
    expect(onIdentifier).toHaveBeenLastCalledWith(expect.any(String));
    expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalled();
  });

  it('enables preview zoom when an undeclared screen resolves as modal above a modal', async () => {
    const onIdentifier = jest.fn();

    function Destination() {
      onIdentifier(use(ZoomTransitionTargetContext).identifier);
      return <View testID="dest-page" />;
    }

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        ),
        index: () => <View testID="index-page" />,
        modal: () => <View testID="modal-page" />,
        dest: Destination,
      });

      await act(() => router.push('/modal'));
      await navigateViaPreviewZoomLink();
      expect(onIdentifier).toHaveBeenLastCalledWith('preview-source');
      expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        '[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.'
      );
    } finally {
      consoleWarnSpy.mockRestore();
    }
  });

  it('uses custom dismissal bounds over gestureEnabled false', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ gestureEnabled: false }} />
        </Stack>
      ),
      index: IndexWithZoomLink,
      dest: function Destination() {
        usePreventZoomTransitionDismissal({
          unstable_dismissalBoundsRect: { minX: 10, maxX: 200 },
        });
        return <View testID="dest-page" />;
      },
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ minX: 10, maxX: 200 });
  });

  it('blocks dismissal with gestureEnabled false when the hook has no custom bounds', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ gestureEnabled: false }} />
        </Stack>
      ),
      index: IndexWithZoomLink,
      dest: function Destination() {
        usePreventZoomTransitionDismissal();
        return <View testID="dest-page" />;
      },
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('restores dismissal when bounds are removed despite the internal gesture override', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ gestureEnabled: true }} />
        </Stack>
      ),
      index: IndexWithZoomLink,
      dest: function Destination() {
        const [bounds, setBounds] = useState<{ maxX: number } | undefined>({ maxX: 44 });
        usePreventZoomTransitionDismissal({
          unstable_dismissalBoundsRect: bounds,
        });
        return (
          <View testID="dest-page">
            <Pressable testID="remove-bounds" onPress={() => setBounds(undefined)}>
              <Text>Remove bounds</Text>
            </Pressable>
          </View>
        );
      },
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 44 });

    await act(() => fireEvent.press(screen.getByTestId('remove-bounds')));
    expect(getLastDismissalBoundsRect()).toBeNull();
  });

  it('warns for preview zoom when the first screen requests modal presentation', async () => {
    let routeKey: string | undefined;
    const onIdentifier = jest.fn();

    function Destination() {
      routeKey = useRoute().key;
      onIdentifier(use(ZoomTransitionTargetContext).identifier);
      return <View testID="dest-page" />;
    }

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await renderRouter(
        {
          _layout: () => (
            <Stack>
              <Stack.Screen name="dest" options={{ presentation: 'modal' }} />
            </Stack>
          ),
          dest: Destination,
        },
        { initialUrl: '/dest' }
      );

      expect(routeKey).toBeDefined();
      await act(() =>
        router.setParams({
          __internal_expo_router_zoom_transition_source_id: 'preview-source',
          __internal_expo_router_zoom_transition_screen_id: routeKey,
          __internal__expo_router_is_preview_navigation: 'true',
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.'
      );
      expect(onIdentifier).toHaveBeenLastCalledWith(null);
      expect(MockedLinkZoomTransitionEnabler).not.toHaveBeenCalled();
    } finally {
      consoleWarnSpy.mockRestore();
    }
  });

  it('passes dismissal bounds to the native enabler on the first zoom navigation', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: IndexWithZoomLink,
      dest: function Destination() {
        usePreventZoomTransitionDismissal({
          unstable_dismissalBoundsRect: { maxX: 44 },
        });
        return <View testID="dest-page" />;
      },
    });

    await navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 44 });
  });
});

it('does not loop when the dismissal hook shares a screen with inline options after plain navigation', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <Link href="/dest">
        <Text testID="plain-link">Open</Text>
      </Link>
    ),
    dest: function Destination() {
      usePreventZoomTransitionDismissal({
        unstable_dismissalBoundsRect: { maxX: 44 },
      });
      return (
        <View testID="dest-page">
          <Stack.Screen options={{ title: 'Destination' }} />
        </View>
      );
    },
  });

  await act(() => fireEvent.press(screen.getByTestId('plain-link')));
  expect(screen.getByTestId('dest-page')).toBeVisible();
});

it('does not loop when the dismissal hook shares a screen with inline options after zoom navigation', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: IndexWithZoomLink,
    dest: function Destination() {
      usePreventZoomTransitionDismissal({
        unstable_dismissalBoundsRect: { maxX: 44 },
      });
      return (
        <View testID="dest-page">
          <Stack.Screen options={{ title: 'Destination' }} />
        </View>
      );
    },
  });

  await navigateViaZoomLink();
  expect(getLastDismissalBoundsRect()).toEqual({ maxX: 44 });
});

it('keeps a preloaded screen mounted and preserves its inline title when zoom activates', async () => {
  const onMount = jest.fn();
  const onUnmount = jest.fn();
  let preloadedKey: string | undefined;

  function Destination() {
    useEffect(() => {
      onMount();
      return () => onUnmount();
    }, []);
    return (
      <View testID="dest-page">
        <Stack.Screen options={{ title: 'Custom title' }} />
      </View>
    );
  }

  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="dest" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    ),
    index: () => <View testID="index-page" />,
    dest: Destination,
  });

  const unsubscribe = internalNavigationEvents.addListener('routePreloaded', ({ routeKey }) => {
    preloadedKey = routeKey;
  });
  await act(() => router.prefetch('/dest'));
  unsubscribe();

  expect(preloadedKey).toBeDefined();
  expect(onMount).toHaveBeenCalledTimes(1);

  await act(() =>
    router.navigate(
      {
        pathname: '/dest',
        params: { __internal_expo_router_zoom_transition_source_id: 'zoom-source' },
      },
      { __internal__PreviewKey: preloadedKey }
    )
  );

  expect(screen.getByTestId('dest-page')).toBeVisible();
  expect(MockedScreenStackItem.mock.lastCall?.[0].headerConfig?.title).toBe('Custom title');
  expect(onMount).toHaveBeenCalledTimes(1);
  expect(onUnmount).not.toHaveBeenCalled();
});
