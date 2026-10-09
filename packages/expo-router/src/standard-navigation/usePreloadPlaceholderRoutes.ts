import { useEffect } from 'react';

type Route = { key: string; name: string };
type Descriptor = {
  route?: { key?: string };
  options?: object;
};

export function usePreloadPlaceholderRoutes({
  routes,
  descriptors,
  preload,
  lazyByDefault,
}: {
  routes: Route[];
  descriptors: Record<string, Descriptor | undefined>;
  preload: (name: string) => void;
  /** Used when a route does not specify `options.lazy`. */
  lazyByDefault: boolean;
}) {
  useEffect(() => {
    for (const route of routes) {
      const descriptor = descriptors[route.key];
      // Options stay generic so navigators without `lazy` remain assignable; tab options may define it.
      const lazy = (descriptor?.options as { lazy?: boolean } | undefined)?.lazy;
      if (descriptor?.route?.key === undefined && !(lazy ?? lazyByDefault)) {
        preload(route.name);
      }
    }
  }, [descriptors, lazyByDefault, preload, routes]);
}
