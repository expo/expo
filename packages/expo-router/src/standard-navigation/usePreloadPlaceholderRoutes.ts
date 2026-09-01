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
  preloadAll = false,
}: {
  routes: Route[];
  descriptors: Record<string, Descriptor | undefined>;
  preload: (name: string) => void;
  /** Used when a route does not specify `options.lazy`. */
  lazyByDefault: boolean;
  preloadAll?: boolean;
}) {
  useEffect(() => {
    // TODO(ENG-26318): Preload routes into state without rendering screens instead of PRELOAD.
    for (const route of routes) {
      const descriptor = descriptors[route.key];
      // Options stay generic so navigators without `lazy` remain assignable; tab options may define it.
      const lazy = (descriptor?.options as { lazy?: boolean } | undefined)?.lazy;
      if (descriptor?.route?.key === undefined && (preloadAll || !(lazy ?? lazyByDefault))) {
        preload(route.name);
      }
    }
  }, [descriptors, lazyByDefault, preload, preloadAll, routes]);
}
