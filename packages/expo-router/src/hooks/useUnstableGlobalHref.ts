'use client';

import { useRouteInfo } from '../global-state/useRouteInfo';

/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
export function useUnstableGlobalHref(): string {
  return useRouteInfo().unstable_globalHref;
}
