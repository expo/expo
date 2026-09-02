import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { PreviewRouteContext } from '../../link/preview/PreviewRouteContext';
import { defaultRouteInfo, type UrlObject } from '../getRouteInfoFromState';
import { RouteInfoContext } from '../routeInfoContext';
import { useRouteInfo } from '../useRouteInfo';

it('returns default route info outside a navigation container', () => {
  const { result } = renderHook(() => useRouteInfo());

  expect(result.current).toBe(defaultRouteInfo);
});

it('returns route info from the navigation container', () => {
  const routeInfo: UrlObject = {
    ...defaultRouteInfo,
    pathname: '/second',
    pathnameWithParams: '/second',
    unstable_globalHref: '/second',
    segments: ['second'],
  };
  const wrapper = ({ children }: PropsWithChildren) => (
    <RouteInfoContext.Provider value={routeInfo}>{children}</RouteInfoContext.Provider>
  );

  const { result } = renderHook(() => useRouteInfo(), { wrapper });

  expect(result.current).toBe(routeInfo);
});

it('returns preview route info inside a preview', () => {
  const preview = {
    pathname: '/preview/one',
    segments: ['preview', 'one'],
    params: { id: 'one' },
  };
  const wrapper = ({ children }: PropsWithChildren) => (
    <PreviewRouteContext.Provider value={preview}>{children}</PreviewRouteContext.Provider>
  );

  const { result } = renderHook(() => useRouteInfo(), { wrapper });

  expect(result.current).toEqual({
    pathname: '/preview/one',
    pathnameWithParams: '/preview/one',
    segments: ['preview', 'one'],
    params: { id: 'one' },
    searchParams: new URLSearchParams(),
    unstable_globalHref: '',
    isIndex: false,
  });
});
