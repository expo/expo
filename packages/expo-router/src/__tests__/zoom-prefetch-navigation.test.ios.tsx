import { screen, act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import * as routing from '../global-state/routing';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { Link } from '../link';
import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../navigationParams';
import { renderRouter } from '../testing-library';
import { parseUrlUsingCustomBase } from '../utils/url';

jest.mock('../link/preview/native', () => {
  const { View } = require('react-native');
  return {
    NativeLinkPreview: jest.fn(({ children }) => (
      <View testID="link-preview-native-view">{children}</View>
    )),
    NativeLinkPreviewContent: jest.fn(({ children }) => (
      <View testID="link-preview-native-preview-view" children={children} />
    )),
    NativeLinkPreviewAction: jest.fn(({ children }) => (
      <View testID="link-preview-native-action-view">{children}</View>
    )),
    LinkZoomTransitionSource: jest.fn(({ children }) => (
      <View testID="link-zoom-transition-source" children={children} />
    )),
    LinkZoomTransitionAlignmentRectDetector: jest.fn(({ children }) => (
      <View testID="link-zoom-transition-alignment-rect-detector" children={children} />
    )),
    LinkZoomTransitionEnabler: jest.fn(({ children }) => (
      <View testID="link-zoom-transition-enabler" children={children} />
    )),
  };
});

jest.mock('../link/zoom/ZoomTransitionEnabler', () => {
  const originalModule = jest.requireActual(
    '../link/zoom/ZoomTransitionEnabler'
  ) as typeof import('../link/zoom/ZoomTransitionEnabler');
  return {
    ...originalModule,
    isZoomTransitionEnabled: () => true,
  };
});

describe('Zoom prefetch navigation', () => {
  const originalLinkTo = routing.linkTo;
  let prefetchSpy: jest.SpyInstance;
  let linkToSpy: jest.SpyInstance;

  beforeEach(() => {
    prefetchSpy = jest.spyOn(router, 'prefetch');
    linkToSpy = jest.spyOn(routing, 'linkTo');
  });

  afterEach(() => {
    prefetchSpy.mockRestore();
    linkToSpy.mockRestore();
  });

  it('pressing a zoom link prefetches then navigates', () => {
    const callOrder: string[] = [];
    prefetchSpy.mockImplementation(() => {
      callOrder.push('prefetch');
    });
    linkToSpy.mockImplementation((...args: Parameters<typeof routing.linkTo>) => {
      callOrder.push('navigate');
      return originalLinkTo(...args);
    });

    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <Link href="/test" asChild>
          <Link.AppleZoom>
            <Text testID="link">Go to test</Text>
          </Link.AppleZoom>
        </Link>
      ),
      test: () => <Text testID="test-page">Test Page</Text>,
    });

    expect(screen.getByTestId('link')).toBeVisible();

    act(() => fireEvent.press(screen.getByTestId('link')));

    // After press + re-render, should have navigated
    expect(screen.getByTestId('test-page')).toBeVisible();
    // Prefetch is called with the zoom-enhanced href (includes internal zoom params)
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    const prefetchHref = prefetchSpy.mock.calls[0][0];
    const prefetchUrl = parseUrlUsingCustomBase(prefetchHref as string);
    expect(prefetchUrl.pathname).toBe('/test');
    expect(
      prefetchUrl.searchParams.has(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME)
    ).toBeTruthy();
    // Prefetch must happen before navigation
    expect(callOrder).toEqual(['prefetch', 'navigate']);
  });

  it('preserves push navigation option through prefetch flow', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <Link href="/test" push asChild>
          <Link.AppleZoom>
            <Text testID="link">Push to test</Text>
          </Link.AppleZoom>
        </Link>
      ),
      test: () => <Text testID="test-page">Test Page</Text>,
    });

    act(() => fireEvent.press(screen.getByTestId('link')));

    expect(screen.getByTestId('test-page')).toBeVisible();
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(true);
  });

  it('preserves replace navigation option through prefetch flow', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <Link href="/test" replace asChild>
          <Link.AppleZoom>
            <Text testID="link">Replace to test</Text>
          </Link.AppleZoom>
        </Link>
      ),
      test: () => <Text testID="test-page">Test Page</Text>,
    });

    act(() => fireEvent.press(screen.getByTestId('link')));

    expect(screen.getByTestId('test-page')).toBeVisible();
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    expect(router.canGoBack()).toBe(false);
  });

  it("calls user's onPress before prefetch", () => {
    const callOrder: string[] = [];
    const onPressSpy = jest.fn(() => callOrder.push('onPress'));
    prefetchSpy.mockImplementation(() => {
      callOrder.push('prefetch');
    });

    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <Link href="/test" asChild onPress={onPressSpy}>
          <Link.AppleZoom>
            <Text testID="link">Go to test</Text>
          </Link.AppleZoom>
        </Link>
      ),
      test: () => <Text testID="test-page">Test Page</Text>,
    });

    act(() => fireEvent.press(screen.getByTestId('link')));

    expect(onPressSpy).toHaveBeenCalledTimes(1);
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('test-page')).toBeVisible();
    // User's onPress must be called before prefetch
    expect(callOrder).toEqual(['onPress', 'prefetch']);
  });

  it('does not prefetch or navigate when onPress calls preventDefault', () => {
    const onPressSpy = jest.fn((e: { preventDefault: () => void }) => {
      e.preventDefault();
    });

    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <Link href="/test" asChild onPress={onPressSpy}>
          <Link.AppleZoom>
            <Text testID="link">Go to test</Text>
          </Link.AppleZoom>
        </Link>
      ),
      test: () => <Text testID="test-page">Test Page</Text>,
    });

    act(() =>
      fireEvent.press(screen.getByTestId('link'), {
        preventDefault: () => {},
        defaultPrevented: true,
      })
    );

    expect(onPressSpy).toHaveBeenCalledTimes(1);
    expect(prefetchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('link')).toBeVisible();
  });

  it('plain link without zoom navigates directly without prefetch', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => (
        <Link href="/test" testID="link">
          Go to test
        </Link>
      ),
      test: () => <Text testID="test-page">Test Page</Text>,
    });

    act(() => fireEvent.press(screen.getByTestId('link')));

    expect(screen.getByTestId('test-page')).toBeVisible();
    // No zoom source, so prefetch should not be called
    expect(prefetchSpy).not.toHaveBeenCalled();
  });
});
