import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

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
