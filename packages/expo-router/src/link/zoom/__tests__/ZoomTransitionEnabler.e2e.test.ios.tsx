import { act, fireEvent, screen } from '@testing-library/react-native';
import { use, useState } from 'react';
import { Text, View } from 'react-native';

import { router } from '../../../imperative-api';
import Stack from '../../../layouts/Stack';
import { renderRouter } from '../../../testing-library';
import { Pressable } from '../../../views/Pressable';
import { Link } from '../../Link';
import { ZoomTransitionTargetContext } from '../zoom-transition-context';

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

jest.mock('../ZoomTransitionEnabler', () => {
  const originalModule = jest.requireActual(
    '../ZoomTransitionEnabler'
  ) as typeof import('../ZoomTransitionEnabler');
  return {
    ...originalModule,
    isZoomTransitionEnabled: () => true,
  };
});

const { LinkZoomTransitionEnabler: MockedLinkZoomTransitionEnabler } = jest.requireMock(
  '../../preview/native'
) as jest.Mocked<typeof import('../../preview/native')>;

function navigateViaZoomLink() {
  const trigger = screen.getByTestId('zoom-link');
  act(() => fireEvent.press(trigger));
  expect(screen.getByTestId('dest-page')).toBeVisible();
}

/** Returns the last dismissalBoundsRect passed to the native enabler component */
function getLastDismissalBoundsRect() {
  const callCount = MockedLinkZoomTransitionEnabler.mock.calls.length;
  if (callCount === 0) return undefined;
  return MockedLinkZoomTransitionEnabler.mock.calls[callCount - 1][0].dismissalBoundsRect;
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

  it('allows dismissal gesture when no gestureEnabled is set', () => {
    renderRouter({
      index: IndexWithZoomLink,
      dest: () => <View testID="dest-page" />,
    });

    navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toBeNull();
  });

  it('blocks dismissal gesture when gestureEnabled: false is set in Stack screenOptions', () => {
    renderRouter({
      _layout: () => <Stack screenOptions={{ gestureEnabled: false }} />,
      index: IndexWithZoomLink,
      dest: () => <View testID="dest-page" />,
    });

    navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('blocks dismissal gesture when gestureEnabled: false is set in Stack.Screen options', () => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ gestureEnabled: false }} />
        </Stack>
      ),
      index: IndexWithZoomLink,
      dest: () => <View testID="dest-page" />,
    });

    navigateViaZoomLink();
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('blocks dismissal gesture on render when gestureEnabled: false is set via Stack.Screen inside page', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: IndexWithZoomLink,
      dest: () => (
        <View testID="dest-page">
          <Stack.Screen options={{ gestureEnabled: false }} />
        </View>
      ),
    });

    expect(screen.getByTestId('index-page')).toBeVisible();
    navigateViaZoomLink();
    // Since we are getting the last dismissalBoundsRect this assertion is true
    // However there will be an initial render with null dismissalBoundsRect before the options take effect
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });
  });

  it('can dynamically block dismissal gesture with gestureEnabled set via Stack.Screen inside page', () => {
    renderRouter({
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
    navigateViaZoomLink();
    // Since we are getting the last dismissalBoundsRect this assertion is true
    // However there will be an initial render with null dismissalBoundsRect before the options take effect
    expect(getLastDismissalBoundsRect()).toBeNull();

    const toggleButton = screen.getByTestId('toggle-gesture-button');
    act(() => fireEvent.press(toggleButton));
    expect(getLastDismissalBoundsRect()).toEqual({ maxX: 0, maxY: 0 });

    act(() => fireEvent.press(toggleButton));
    expect(getLastDismissalBoundsRect()).toBeNull();
  });
});

function navigateViaPreviewZoomLink() {
  // Simulate preview navigation: navigate with __internal__PreviewKey which sets
  // INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME on the route params.
  // The zoom source ID is included as a param so the stack's getRehydratedState
  // will attach the screen ID automatically.
  act(() =>
    router.navigate(
      {
        pathname: '/dest',
        params: {
          __internal_expo_router_zoom_transition_source_id: 'preview-source',
        },
      },
      { __internal__PreviewKey: 'preview-key-123' }
    )
  );
  expect(screen.getByTestId('dest-page')).toBeVisible();
}

describe('hasEnabler tracking', () => {
  let onHasEnabler: jest.Mock;

  function DestWithEnablerTracker({ onHasEnabler }: { onHasEnabler: (v: boolean) => void }) {
    const { hasEnabler } = use(ZoomTransitionTargetContext);
    onHasEnabler(hasEnabler);
    return <View testID="dest-page" />;
  }

  beforeEach(() => {
    MockedLinkZoomTransitionEnabler.mockClear();
    onHasEnabler = jest.fn();
  });

  it('hasEnabler is true in a screen with zoom transition', () => {
    renderRouter({
      index: IndexWithZoomLink,
      dest: () => <DestWithEnablerTracker onHasEnabler={onHasEnabler} />,
    });

    navigateViaZoomLink();
    expect(onHasEnabler).toHaveBeenCalledWith(true);
  });

  it('hasEnabler is true in a modal destination without preview', () => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ presentation: 'modal' }} />
        </Stack>
      ),
      index: IndexWithZoomLink,
      dest: () => <DestWithEnablerTracker onHasEnabler={onHasEnabler} />,
    });

    navigateViaZoomLink();
    expect(onHasEnabler).toHaveBeenCalledWith(true);
  });

  it('hasEnabler is true in a modal destination with preview', () => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="dest" options={{ presentation: 'modal' }} />
        </Stack>
      ),
      index: () => <View testID="index-page" />,
      dest: () => <DestWithEnablerTracker onHasEnabler={onHasEnabler} />,
    });

    navigateViaPreviewZoomLink();
    expect(onHasEnabler).toHaveBeenCalledWith(true);
  });

  it('hasEnabler is false when non-modal and preview', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderRouter({
      index: () => <View testID="index-page" />,
      dest: () => <DestWithEnablerTracker onHasEnabler={onHasEnabler} />,
    });

    navigateViaPreviewZoomLink();
    // Non-modal + preview navigation should warn and not enable zoom transition
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Zoom transition with link preview is only supported for screens presented modally'
      )
    );
    expect(onHasEnabler).not.toHaveBeenCalledWith(true);
    consoleWarnSpy.mockRestore();
  });
});
