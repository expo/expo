import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type {
  NativeStackDescriptor,
  NativeStackDescriptorMap,
} from '../../../fork/native-stack/descriptors-context';
import { DescriptorsContext } from '../../../fork/native-stack/descriptors-context';
import {
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
} from '../../../navigationParams';
import { useIsPreview } from '../../preview/PreviewRouteContext';
import { useShouldEnableZoomTransition } from '../ZoomTransitionEnabler.ios';

jest.mock('../../preview/PreviewRouteContext');
jest.mock('../../preview/native', () => ({
  LinkZoomTransitionEnabler: jest.fn(() => null),
}));

const mockUseIsPreview = useIsPreview as jest.Mock;

function makeRoute(key: string, params: Record<string, unknown> = {}) {
  return {
    key,
    name: 'test',
    params: {
      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-123',
      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: key,
      ...params,
    },
  };
}

function renderHookWithDescriptors(route: unknown, descriptors: NativeStackDescriptorMap = {}) {
  return renderHook(() => useShouldEnableZoomTransition(route), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <DescriptorsContext value={descriptors}>{children}</DescriptorsContext>
    ),
  });
}

describe('useShouldEnableZoomTransition', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsPreview.mockReturnValue(false);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('returns true for valid zoom transition route', () => {
    const routeKey = 'route-1';
    const route = makeRoute(routeKey);
    const descriptors: NativeStackDescriptorMap = {
      [routeKey]: { options: {} } as NativeStackDescriptor,
    };

    const { result } = renderHookWithDescriptors(route, descriptors);

    expect(result.current).toBe(true);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('returns false when route has no zoom params', () => {
    const route = { key: 'route-1', name: 'test', params: {} };

    const { result } = renderHookWithDescriptors(route);

    expect(result.current).toBe(false);
  });

  it('returns false when route is rendered in preview', () => {
    mockUseIsPreview.mockReturnValue(true);
    const route = makeRoute('route-1');

    const { result } = renderHookWithDescriptors(route);

    expect(result.current).toBe(false);
  });

  it('returns false when zoomTransitionScreenId does not match route.key', () => {
    const route = {
      key: 'route-1',
      name: 'test',
      params: {
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-123',
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: 'different-key',
      },
    };

    const { result } = renderHookWithDescriptors(route);

    expect(result.current).toBe(false);
  });

  it('warns when link preview navigation targets a non-modal screen', () => {
    const routeKey = 'route-1';
    const route = makeRoute(routeKey, {
      [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
    });
    const descriptors: NativeStackDescriptorMap = {
      [routeKey]: { options: {} } as any,
    };

    const { result } = renderHookWithDescriptors(route, descriptors);

    expect(result.current).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.'
    );
  });

  it.each(['fullScreenModal', 'modal', 'formSheet', 'pageSheet'] as const)(
    'does not warn when link preview navigation targets a %s screen',
    (presentation) => {
      const routeKey = 'route-1';
      const route = makeRoute(routeKey, {
        [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
      });
      const descriptors: NativeStackDescriptorMap = {
        [routeKey]: { options: { presentation } } as any,
      };

      const { result } = renderHookWithDescriptors(route, descriptors);

      expect(result.current).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    }
  );

  it('returns false for null route', () => {
    const { result } = renderHookWithDescriptors(null);
    expect(result.current).toBe(false);
  });

  it('returns false for undefined route', () => {
    const { result } = renderHookWithDescriptors(undefined);
    expect(result.current).toBe(false);
  });
});
