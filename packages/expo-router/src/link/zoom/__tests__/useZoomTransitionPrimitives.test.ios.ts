import { renderHook, act } from '@testing-library/react-native';

import {
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../../navigationParams';
import { useIsPreview } from '../../preview/PreviewRouteContext';
import { isZoomTransitionEnabled } from '../ZoomTransitionEnabler';
import { useZoomTransitionPrimitives } from '../useZoomTransitionPrimitives.ios';

jest.mock('../ZoomTransitionEnabler');
jest.mock('../../preview/PreviewRouteContext');

describe('useZoomTransitionPrimitives', () => {
  const mockIsZoomTransitionEnabled = isZoomTransitionEnabled as jest.Mock;
  const mockUseIsPreview = useIsPreview as jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsPreview.mockReturnValue(false);
    mockIsZoomTransitionEnabled.mockReturnValue(true);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('returns zoomTransitionId when conditions are met', () => {
    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue.canAddSource).toBe(true);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue.canAddSource !== true) {
      throw new Error('');
    }
    expect(result.current.zoomTransitionSourceContextValue?.identifier).toBeTruthy();
    expect(typeof result.current.zoomTransitionSourceContextValue?.identifier).toBe('string');
  });

  test('returns canAddSource false and reason undefined when preview is active', () => {
    mockUseIsPreview.mockReturnValue(true);

    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(false);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue?.canAddSource !== false) {
      throw new Error('');
    }
    expect(result.current.zoomTransitionSourceContextValue?.reason).toBeUndefined();
  });

  test('returns canAddSource false and correct reason when zoom transition is disabled', () => {
    mockIsZoomTransitionEnabled.mockReturnValue(false);

    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(false);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue?.canAddSource !== false) {
      throw new Error('');
    }
    expect(result.current.zoomTransitionSourceContextValue?.reason).toBe(
      'Zoom transitions are not enabled.'
    );
  });

  test('adds and removes sources correctly', () => {
    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
    expect(result.current.zoomTransitionSourceContextValue?.reason).toBeUndefined();

    act(() => {
      result.current.zoomTransitionSourceContextValue?.addSource();
    });

    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
    expect(result.current.zoomTransitionSourceContextValue?.reason).toBeUndefined();

    act(() => {
      result.current.zoomTransitionSourceContextValue?.removeSource();
    });

    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
    expect(result.current.zoomTransitionSourceContextValue?.reason).toBeUndefined();
  });

  test('retains transition id between rerenders', () => {
    const { result, rerender } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue?.canAddSource !== true) {
      throw new Error('');
    }
    const initialId = result.current.zoomTransitionSourceContextValue?.identifier;

    expect(initialId).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.identifier).toBe(initialId);

    act(() => {
      rerender({ href: '/test', asChild: true });
    });

    expect(result.current.zoomTransitionSourceContextValue?.identifier).toBe(initialId);

    act(() => {
      rerender({ href: '/different', asChild: true });
    });

    expect(result.current.zoomTransitionSourceContextValue?.identifier).toBe(initialId);
  });

  test('throws error when more than one source is added', () => {
    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
    expect(() => {
      act(() => {
        // A check to satisfy TypeScript
        if (result.current.zoomTransitionSourceContextValue?.canAddSource !== true) {
          throw new Error('');
        }
        result.current.zoomTransitionSourceContextValue?.addSource();
        result.current.zoomTransitionSourceContextValue?.addSource();
      });
    }).toThrow(
      '[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.'
    );
  });

  test('returns canAddSource false with correct reason when asChild is false', () => {
    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: false })
    );

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(false);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue?.canAddSource !== false) {
      throw new Error('');
    }
    expect(result.current.zoomTransitionSourceContextValue?.reason).toBe(
      'Link must be used with `asChild` prop to enable zoom transitions.'
    );
  });

  test.each([
    { href: '/test', expected: { pathname: '/test', baseParams: {} } },
    { href: '/oneParam?x=123', expected: { pathname: '/oneParam', baseParams: { x: '123' } } },
    {
      href: '/twoParams?x=123&abc=test',
      expected: { pathname: '/twoParams', baseParams: { x: '123', abc: 'test' } },
    },
    {
      href: `/oneAndZoom?x=123&${INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME}=test`,
      expected: { pathname: '/oneAndZoom', baseParams: { x: '123' } },
    },
    {
      href: `/oneAndInternal?x=123&${INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME}=1`,
      expected: {
        pathname: '/oneAndInternal',
        baseParams: { x: '123', [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: '1' },
      },
    },
    {
      href: `/internalAndZoom?${INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME}=1&${INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME}=123`,
      expected: {
        pathname: '/internalAndZoom',
        baseParams: { [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: '1' },
      },
    },
    {
      href: `/nonAndZoom?${INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME}=123`,
      expected: { pathname: '/nonAndZoom', baseParams: {} },
    },
  ])('computes href with zoom transition id for string href $href', ({ href, expected }) => {
    const { result } = renderHook(() => useZoomTransitionPrimitives({ href, asChild: true }));

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue?.canAddSource !== true) {
      throw new Error('');
    }

    const initialId = result.current.zoomTransitionSourceContextValue?.identifier;

    act(() => {
      // A check to satisfy TypeScript
      if (result.current.zoomTransitionSourceContextValue?.canAddSource !== true) {
        throw new Error('');
      }
      result.current.zoomTransitionSourceContextValue?.addSource();
    });

    expect(result.current.href).toEqual({
      pathname: expected.pathname,
      params: {
        ...expected.baseParams,
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: initialId!,
      },
    });
  });

  test.each([
    { params: undefined, expectedParams: {} },
    { params: {} },
    { params: { x: '123' } },
    {
      params: { x: '123', abc: 'test' },
    },
    {
      params: { x: '123', [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'test' },
      expectedParams: { x: '123' },
    },
    {
      params: { x: '123', [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: '1' },
    },
    {
      params: {
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: '1',
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: '123',
      },
      expectedParams: {
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: '1',
      },
    },
    {
      params: { [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: '123' },
      expectedParams: {},
    },
  ])(
    'computes href with zoom transition id for object href with params: $params',
    ({ params, expectedParams }) => {
      const { result } = renderHook(() =>
        useZoomTransitionPrimitives({
          href: { pathname: '/test', params },
          asChild: true,
        })
      );

      expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
      expect(result.current.zoomTransitionSourceContextValue?.canAddSource).toBe(true);
      // A check to satisfy TypeScript
      if (result.current.zoomTransitionSourceContextValue?.canAddSource !== true) {
        throw new Error('');
      }

      const initialId = result.current.zoomTransitionSourceContextValue?.identifier;

      act(() => {
        // A check to satisfy TypeScript
        if (result.current.zoomTransitionSourceContextValue?.canAddSource !== true) {
          throw new Error('');
        }
        result.current.zoomTransitionSourceContextValue?.addSource();
      });

      expect(result.current.href).toEqual({
        pathname: '/test',
        params: {
          ...(expectedParams || params),
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: initialId!,
        },
      });
    }
  );

  test('returns original href when no zoom source', () => {
    const { result } = renderHook(() =>
      useZoomTransitionPrimitives({ href: '/test', asChild: true })
    );

    expect(result.current.href).toBe('/test');
  });

  test.each([
    { href: 'https://example.com' },
    { href: 'mailto:test@example.com' },
    { href: 'tel:+1234567890' },
    { href: 'file://path/to/file' },
    {
      href: {
        pathname: 'https://example.com',
        params: {},
      },
    },
    {
      href: {
        pathname: 'https://example.com',
        params: {
          test: 'value',
        },
      },
    },
  ])('when non relative href $href is provided, zoom transition is not enabled', ({ href }) => {
    const { result } = renderHook(() => useZoomTransitionPrimitives({ href, asChild: true }));

    expect(result.current.zoomTransitionSourceContextValue).toBeDefined();
    // A check to satisfy TypeScript
    if (!result.current.zoomTransitionSourceContextValue) {
      throw new Error('');
    }
    expect(result.current.zoomTransitionSourceContextValue.canAddSource).toBe(false);
    // A check to satisfy TypeScript
    if (result.current.zoomTransitionSourceContextValue.canAddSource !== false) {
      throw new Error('');
    }
    expect(result.current.zoomTransitionSourceContextValue.reason).toBe(
      'Zoom transitions can only be used with internal links.'
    );
    expect(result.current.href).toBe(href);
  });
});
