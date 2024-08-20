/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/client.ts#L1
 */

'use client';

import {
  Component,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useTransition,
  createElement,
  createContext,
  useState,
  Fragment,
} from 'react';

import type {
  ComponentProps,
  FunctionComponent,
  ReactNode,
  MutableRefObject,
  AnchorHTMLAttributes,
  ReactElement,
  MouseEvent,
} from 'react';

import { PARAM_KEY_SKIP, getComponentIds, getInputString } from './common.js';
import type { RouteProps } from './common.js';
import { prefetchRSC, Root, Slot, useRefetch } from './host.js';

const normalizeRoutePath = (path: string) => {
  for (const suffix of ['/', '/index.html']) {
    if (path.endsWith(suffix)) {
      return path.slice(0, -suffix.length) || '/';
    }
  }
  return path;
};

const parseRoute = (url: URL): RouteProps => {
  if ((globalThis as any).__EXPO_ROUTER_404__) {
    return { path: '/404', query: '', hash: '' };
  }
  const { pathname, searchParams, hash } = url;
  if (searchParams.has(PARAM_KEY_SKIP)) {
    console.warn(`The search param "${PARAM_KEY_SKIP}" is reserved`);
  }
  return {
    path: normalizeRoutePath(pathname),
    query: searchParams.toString(),
    hash,
  };
};
const getHref = () =>
  process.env.EXPO_OS === 'web'
    ? window.location.href
    : // TODO: This is hardcoded on native to simplify the initial PR.
      'http://localhost:8081/';

type ChangeRoute = (
  route: RouteProps,
  options?: {
    checkCache?: boolean;
    skipRefetch?: boolean;
  }
) => void;

type PrefetchRoute = (route: RouteProps) => void;

const RouterContext = createContext<{
  route: RouteProps;
  changeRoute: ChangeRoute;
  prefetchRoute: PrefetchRoute;
} | null>(null);

const InnerRouter = ({ routerData }: { routerData: RouterData }) => {
  const refetch = useRefetch();

  // TODO: strip when "is exporting".
  if (process.env.NODE_ENV === 'development') {
    const refetchRoute = () => {
      const loc = parseRoute(new URL(getHref()));
      const input = getInputString(loc.path);
      refetch(input, loc.searchParams);
    };
    globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
    const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(
      globalThis.__EXPO_REFETCH_ROUTE__
    );
    if (index !== -1) {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
    } else {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
    }
    globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
  }

  const initialRouteRef = useRef<RouteProps>();
  if (!initialRouteRef.current) {
    initialRouteRef.current = parseRoute(new URL(getHref()));
  }
  const [route, setRoute] = useState(() => ({
    // This is the first initialization of the route, and it has
    // to ignore the hash, because on server side there is none.
    // Otherwise there will be a hydration error.
    // The client side route, including the hash, will be updated in the effect below.
    ...initialRouteRef.current!,
    hash: '',
  }));

  // Update the route post-load to include the current hash.
  useEffect(() => {
    const initialRoute = initialRouteRef.current!;
    setRoute((prev) => {
      if (
        prev.path === initialRoute.path &&
        prev.query === initialRoute.query &&
        prev.hash === initialRoute.hash
      ) {
        return prev;
      }
      return initialRoute;
    });
  }, []);

  const componentIds = getComponentIds(route.path);

  const [cached, setCached] = useState<Record<string, RouteProps>>(() => {
    return Object.fromEntries(componentIds.map((id) => [id, route]));
  });
  const cachedRef = useRef(cached);
  useEffect(() => {
    cachedRef.current = cached;
  }, [cached]);

  const changeRoute: ChangeRoute = useCallback(
    (route, options) => {
      const { checkCache, skipRefetch } = options || {};
      startTransition(() => {
        setRoute(route);
      });
      const componentIds = getComponentIds(route.path);
      if (
        checkCache &&
        componentIds.every((id) => {
          const cachedLoc = cachedRef.current[id];
          return cachedLoc && equalRouteProps(cachedLoc, route);
        })
      ) {
        return; // everything is cached
      }
      const shouldSkip = routerData[0];
      const skip = getSkipList(shouldSkip, componentIds, route, cachedRef.current);
      if (componentIds.every((id) => skip.includes(id))) {
        return; // everything is skipped
      }
      const input = getInputString(route.path);
      if (!skipRefetch) {
        refetch(
          input,
          new URLSearchParams([
            ...Array.from(new URLSearchParams(route.query).entries()),
            ...skip.map((id) => [PARAM_KEY_SKIP, id]),
          ])
        );
      }
      startTransition(() => {
        setCached((prev) => ({
          ...prev,
          ...Object.fromEntries(
            componentIds.flatMap((id) => (skip.includes(id) ? [] : [[id, route]]))
          ),
        }));
      });
    },
    [refetch, routerData]
  );

  const prefetchRoute: PrefetchRoute = useCallback(
    (route) => {
      const componentIds = getComponentIds(route.path);
      const shouldSkip = routerData[0];
      const skip = getSkipList(shouldSkip, componentIds, route, cachedRef.current);
      if (componentIds.every((id) => skip.includes(id))) {
        return; // everything is cached
      }
      const input = getInputString(route.path);
      const searchParamsString = new URLSearchParams([
        ...Array.from(new URLSearchParams(route.query).entries()),
        ...skip.map((id) => [PARAM_KEY_SKIP, id]),
      ]).toString();
      prefetchRSC(input, searchParamsString);
      (globalThis as any).__WAKU_ROUTER_PREFETCH__?.(route.path);
    },
    [routerData]
  );

  useEffect(() => {
    const callback = () => {
      const route = parseRoute(new URL(window.location.href));
      changeRoute(route, { checkCache: true });
    };
    window.addEventListener('popstate', callback);
    return () => {
      window.removeEventListener('popstate', callback);
    };
  }, [changeRoute]);

  useEffect(() => {
    const callback = (pathname: string, searchParamsString: string) => {
      const url = new URL(window.location.href);
      url.pathname = pathname;
      url.search = searchParamsString;
      url.hash = '';
      window.history.pushState(
        {
          ...window.history.state,
          waku_new_path: url.pathname !== window.location.pathname,
        },
        '',
        url
      );
      changeRoute(parseRoute(url), { skipRefetch: true });
    };
    const listeners = (routerData[1] ||= new Set());
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, [changeRoute, routerData]);

  useEffect(() => {
    const { hash } = window.location;
    const { state } = window.history;
    const element = hash && document.getElementById(hash.slice(1));
    window.scrollTo({
      left: 0,
      top: element ? element.getBoundingClientRect().top + window.scrollY : 0,
      behavior: state?.waku_new_path ? 'instant' : 'auto',
    });
  });

  const children = componentIds.reduceRight(
    (acc: ReactNode, id) =>
      createElement(RouterSlot, { route, routerData, cachedRef, id, fallback: acc }, acc),
    null
  );

  return createElement(
    RouterContext.Provider,
    { value: { route, changeRoute, prefetchRoute } },
    children
  );
};

export function useRouter_UNSTABLE() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('Missing Router');
  }
  const { route, changeRoute, prefetchRoute } = router;
  const push = useCallback(
    (to: string) => {
      const url = new URL(to, window.location.href);
      window.history.pushState(
        {
          ...window.history.state,
          waku_new_path: url.pathname !== window.location.pathname,
        },
        '',
        url
      );
      changeRoute(parseRoute(url));
    },
    [changeRoute]
  );
  const replace = useCallback(
    (to: string) => {
      const url = new URL(to, window.location.href);
      window.history.replaceState(window.history.state, '', url);
      changeRoute(parseRoute(url));
    },
    [changeRoute]
  );
  const reload = useCallback(() => {
    const url = new URL(window.location.href);
    changeRoute(parseRoute(url));
  }, [changeRoute]);
  const back = useCallback(() => {
    // FIXME is this correct?
    window.history.back();
  }, []);
  const forward = useCallback(() => {
    // FIXME is this correct?
    window.history.forward();
  }, []);
  const prefetch = useCallback(
    (to: string) => {
      const url = new URL(to, window.location.href);
      prefetchRoute(parseRoute(url));
    },
    [prefetchRoute]
  );
  return {
    ...route,
    push,
    replace,
    reload,
    back,
    forward,
    prefetch,
  };
}

const RouterSlot = ({
  route,
  routerData,
  cachedRef,
  id,
  fallback,
  children,
}: {
  route: RouteProps;
  routerData: RouterData;
  cachedRef: MutableRefObject<Record<string, RouteProps>>;
  id: string;
  fallback?: ReactNode;
  children?: ReactNode;
}) => {
  const unstable_shouldRenderPrev = (_err: unknown) => {
    const shouldSkip = routerData[0];
    const skip = getSkipList(shouldSkip, [id], route, cachedRef.current);
    return skip.length > 0;
  };
  return createElement(Slot, { id, fallback, unstable_shouldRenderPrev }, children);
};

const getSkipList = (
  shouldSkip: ShouldSkip | undefined,
  componentIds: readonly string[],
  route: RouteProps,
  cached: Record<string, RouteProps>
): string[] => {
  const shouldSkipObj = Object.fromEntries(shouldSkip || []);
  return componentIds.filter((id) => {
    const prevProps = cached[id];
    if (!prevProps) {
      return false;
    }
    const shouldCheck = shouldSkipObj[id];
    if (!shouldCheck) {
      return false;
    }
    if (shouldCheck[0] && route.path !== prevProps.path) {
      return false;
    }
    if (shouldCheck[0] && route.query !== prevProps.query) {
      return false;
    }
    return true;
  });
};

// TODO revisit shouldSkip API
type ShouldSkip = (readonly [
  componentId: string,
  readonly [
    path?: boolean, // if we compare path
    keys?: string[], // searchParams keys to compare
  ],
])[];

// Note: The router data must be a stable mutable object (array).
type RouterData = [
  shouldSkip?: ShouldSkip,
  locationListners?: Set<(path: string, query: string) => void>,
];

const DEFAULT_ROUTER_DATA: RouterData = [];

export function Router({ routerData = DEFAULT_ROUTER_DATA }) {
  const route = parseRoute(new URL(getHref()));
  const initialInput = getInputString(route.path);
  const initialSearchParamsString = route.query;
  const unstable_onFetchData = () => {};
  return createElement(
    Root as FunctionComponent<Omit<ComponentProps<typeof Root>, 'children'>>,
    { initialInput, initialSearchParamsString, unstable_onFetchData },
    createElement(InnerRouter, { routerData })
  );
}

const notAvailableInServer = (name: string) => () => {
  throw new Error(`${name} is not in the server`);
};
/**
 * ServerRouter for SSR
 * This is not a public API.
 */
export function ServerRouter({ children, route }: { children: ReactNode; route: RouteProps }) {
  return createElement(
    Fragment,
    null,
    createElement(
      RouterContext.Provider,
      {
        value: {
          route,
          changeRoute: notAvailableInServer('changeRoute'),
          prefetchRoute: notAvailableInServer('prefetchRoute'),
        },
      },
      children
    )
  );
}

export type LinkProps = {
  href: string;
  pending?: ReactNode;
  notPending?: ReactNode;
  children: ReactNode;
  unstable_prefetchOnEnter?: boolean;
  unstable_prefetchOnView?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function Link({
  href: to,
  children,
  pending,
  notPending,
  unstable_prefetchOnEnter,
  unstable_prefetchOnView,
  ...props
}: LinkProps): ReactElement {
  const router = useContext(RouterContext);
  const changeRoute = router
    ? router.changeRoute
    : () => {
        throw new Error('Missing Router');
      };
  const prefetchRoute = router
    ? router.prefetchRoute
    : () => {
        throw new Error('Missing Router');
      };
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLAnchorElement>();

  useEffect(() => {
    if (unstable_prefetchOnView && ref.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const url = new URL(to, window.location.href);
              if (router && url.href !== window.location.href) {
                const route = parseRoute(url);
                router.prefetchRoute(route);
              }
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(ref.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [unstable_prefetchOnView, router, to]);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const url = new URL(to, window.location.href);
    if (url.href !== window.location.href) {
      const route = parseRoute(url);
      prefetchRoute(route);
      startTransition(() => {
        window.history.pushState(
          {
            ...window.history.state,
            waku_new_path: url.pathname !== window.location.pathname,
          },
          '',
          url
        );
        changeRoute(route);
      });
    }
    props.onClick?.(event);
  };
  const onMouseEnter = unstable_prefetchOnEnter
    ? (event: MouseEvent<HTMLAnchorElement>) => {
        const url = new URL(to, window.location.href);
        if (url.href !== window.location.href) {
          const route = parseRoute(url);
          prefetchRoute(route);
        }
        props.onMouseEnter?.(event);
      }
    : props.onMouseEnter;
  const ele = createElement('a', { ...props, href: to, onClick, onMouseEnter, ref }, children);
  if (isPending && pending !== undefined) {
    return createElement(Fragment, null, ele, pending);
  }
  if (!isPending && notPending !== undefined) {
    return createElement(Fragment, null, ele, notPending);
  }
  return ele;
}
