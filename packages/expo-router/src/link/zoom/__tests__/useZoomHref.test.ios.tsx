import { renderHook, act } from '@testing-library/react-native';
import { nanoid } from 'nanoid/non-secure';

import {
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../../navigationParams';
import { useIsPreview } from '../../preview/PreviewRouteContext';
import { isZoomTransitionEnabled } from '../ZoomTransitionEnabler';
import { useZoomHref } from '../useZoomHref';
import {
  ZoomTransitionSourceContext,
  type ZoomTransitionSourceContextValueType,
} from '../zoom-transition-context';

jest.mock('../ZoomTransitionEnabler');
jest.mock('../../preview/PreviewRouteContext');

const BAE_CONTEXT_VALUE: ZoomTransitionSourceContextValueType = {
  hasZoomSource: true,
  identifier: '',
  addSource: () => {},
  removeSource: () => {},
};

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
    const id = nanoid();
    const { result } = renderHook(() => useZoomHref({ href }), {
      wrapper: ({ children }) => (
        <ZoomTransitionSourceContext
          value={{
            ...BAE_CONTEXT_VALUE,
            identifier: id,
          }}>
          {children}
        </ZoomTransitionSourceContext>
      ),
    });

    expect(result.current).toEqual({
      pathname: expected.pathname,
      params: {
        ...expected.baseParams,
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: id!,
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
      const id = nanoid();
      const { result } = renderHook(
        () =>
          useZoomHref({
            href: { pathname: '/test', params },
          }),
        {
          wrapper: ({ children }) => (
            <ZoomTransitionSourceContext
              value={{
                ...BAE_CONTEXT_VALUE,
                identifier: id,
              }}>
              {children}
            </ZoomTransitionSourceContext>
          ),
        }
      );

      expect(result.current).toEqual({
        pathname: '/test',
        params: {
          ...(expectedParams ?? params),
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: id!,
        },
      });
    }
  );

  test.each([
    { href: '/test' },
    { href: '/oneParam?x=123' },
    {
      href: '/twoParams?x=123&abc=test',
    },
    {
      href: `/oneAndInternal?x=123&${INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME}=1`,
    },
    {
      href: {
        pathname: '/test',
      },
    },
    {
      href: {
        pathname: '/test',
        params: { a: '1' },
      },
    },
  ])('returns original href $href when no zoom source', ({ href }) => {
    const id = nanoid();
    const { result } = renderHook(() => useZoomHref({ href }), {
      wrapper: ({ children }) => (
        <ZoomTransitionSourceContext
          value={{
            ...BAE_CONTEXT_VALUE,
            hasZoomSource: false,
            identifier: id,
          }}>
          {children}
        </ZoomTransitionSourceContext>
      ),
    });

    expect(result.current).toBe(href);
  });
});
