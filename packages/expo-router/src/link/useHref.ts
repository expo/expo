import { usePathname, useSearchParams, useSegments } from '../hooks';
import { HrefObject } from './href';

/** @deprecated */
type RouteInfo = Omit<Required<HrefObject>, 'query'> & {
  /** Normalized path representing the selected route `/[id]?id=normal` -> `/normal` */
  href: string;
};

/** @deprecated */
export function useHref(): RouteInfo {
  console.warn('useHref is deprecated in favor of usePathname, useSearchParams, and useSegments');

  return {
    href: usePathname(),
    pathname: useSegments().join('/'),
    params: useSearchParams(),
  };
}
