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

import { Slot as ReactSlot } from '@radix-ui/react-slot';
import {
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
import { Text } from 'react-native';

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

const equalRouteProps = (a: RouteProps, b: RouteProps) => {
  if (a.path !== b.path) {
    return false;
  }
  if (a.query !== b.query) {
    return false;
  }
  return true;
};

const RouterContext = createContext<{
  route: RouteProps;
  changeRoute: ChangeRoute;
  prefetchRoute: PrefetchRoute;
} | null>(null);

const InnerRouter = ({ routerData }: { routerData: RouterData }) => {
  const refetch = useRefetch();

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

  //  const refetchRoute = () => {
  //   const loc = parseRoute(new URL(getHref()));
  //   const input = getInputString(loc.path);
  //   refetch(input, loc.query);
  //   refetch(input, JSON.stringify({ query: route.query }));
  // };
  // globalThis.__EXPO_REFETCH_ROUTE_NO_CACHE__ = refetchRoute;

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
        refetch(input, JSON.stringify({ query: route.query, skip }));
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
      prefetchRSC(input, JSON.stringify({ query: route.query, skip }));
      (globalThis as any).__EXPO_ROUTER_PREFETCH__?.(route.path);
    },
    [routerData]
  );

  useEffect(() => {
    const callback = () => {
      const route = parseRoute(new URL(getHref()));
      changeRoute(route, { checkCache: true });
    };
    if (window.addEventListener) {
      window.addEventListener('popstate', callback);
      return () => {
        window.removeEventListener('popstate', callback);
      };
    }
    return () => {};
  }, [changeRoute]);

  useEffect(() => {
    const callback = (pathname: string, searchParamsString: string) => {
      const url = new URL(getHref());
      url.pathname = pathname;
      url.search = searchParamsString;
      url.hash = '';
      getHistory().pushState(
        {
          ...getHistory().state,
          expo_new_path: url.pathname !== window.location.pathname,
        },
        '',
        url
      );
      changeRoute(parseRoute(url), { skipRefetch: true });
    };
    // eslint-disable-next-line no-multi-assign
    const listeners = (routerData[1] ||= new Set());
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, [changeRoute, routerData]);

  useEffect(() => {
    const { hash } = window.location;
    const { state } = getHistory();
    const element = hash && document.getElementById(hash.slice(1));
    if (window.scrollTo) {
      window.scrollTo({
        left: 0,
        top: element ? element.getBoundingClientRect().top + window.scrollY : 0,
        behavior: state?.expo_new_path ? 'instant' : 'auto',
      });
    } else {
      // TODO: Native
      console.log('window.scrollTo is not available');
    }
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

function getHistory() {
  if (process.env.EXPO_OS === 'web') {
    return window.history;
  }
  // Native shim
  return {
    pushState: () => {},
    replaceState: () => {},
    back: () => {},
    forward: () => {},
    state: {},
  };
}

export function useRouter_UNSTABLE() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('Missing Router');
  }
  const { route, changeRoute, prefetchRoute } = router;
  const push = useCallback(
    (to: string) => {
      const url = new URL(to, getHref());
      getHistory().pushState(
        {
          ...getHistory().state,
          expo_new_path: url.pathname !== window.location.pathname,
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
      const url = new URL(to, getHref());
      getHistory().replaceState(getHistory().state, '', url);
      changeRoute(parseRoute(url));
    },
    [changeRoute]
  );
  const reload = useCallback(() => {
    const url = new URL(getHref());
    changeRoute(parseRoute(url));
  }, [changeRoute]);
  const back = useCallback(() => {
    // FIXME is this correct?
    getHistory().back();
  }, []);
  const forward = useCallback(() => {
    // FIXME is this correct?
    getHistory().forward();
  }, []);
  const prefetch = useCallback(
    (to: string) => {
      const url = new URL(to, getHref());
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
  // const unstable_shouldRenderPrev = (_err: unknown) => {
  //   const shouldSkip = routerData[0];
  //   const skip = getSkipList(shouldSkip, [id], route, cachedRef.current);
  //   return skip.length > 0;
  // };
  return createElement(Slot, { id, fallback }, children);
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
  string,
  readonly [
    boolean, // if we compare path
    string[], // searchParams keys to compare
  ],
])[];

// Note: The router data must be a stable mutable object (array).
type RouterData = [
  shouldSkip?: ShouldSkip,
  locationListeners?: Set<(path: string, query: string) => void>,
];

const DEFAULT_ROUTER_DATA: RouterData = [];

export function Router({ routerData = DEFAULT_ROUTER_DATA }) {
  const route = parseRoute(new URL(getHref()));
  const initialInput = getInputString(route.path);
  const initialParams = JSON.stringify({ query: route.query });
  const unstable_onFetchData = () => {};
  return createElement(
    Root as FunctionComponent<Omit<ComponentProps<typeof Root>, 'children'>>,
    { initialInput, initialParams, unstable_onFetchData },
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
  asChild?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

export function Link({
  href: to,
  children,
  pending,
  notPending,
  unstable_prefetchOnEnter,
  unstable_prefetchOnView,
  asChild,
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
              const url = new URL(to, getHref());
              if (router && url.href !== getHref()) {
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
    return () => {};
  }, [unstable_prefetchOnView, router, to]);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const url = new URL(to, getHref());
    // TODO: Use in-memory route for native platforms.
    // if (url.href !== getHref()) {
    const route = parseRoute(url);
    prefetchRoute(route);
    startTransition(() => {
      getHistory().pushState(
        {
          ...getHistory().state,
          expo_new_path: url.pathname !== window.location.pathname,
        },
        '',
        url
      );
      changeRoute(route);
    });
    // }
    props.onClick?.(event);
  };
  // const onMouseEnter = unstable_prefetchOnEnter
  //   ? (event: MouseEvent<HTMLAnchorElement>) => {
  //       const url = new URL(to, getHref());
  //       if (url.href !== getHref()) {
  //         const route = parseRoute(url);
  //         prefetchRoute(route);
  //       }
  //       props.onMouseEnter?.(event);
  //     }
  //   : props.onMouseEnter;

  const ele = createElement(
    // @ts-expect-error
    asChild ? ReactSlot : Text,
    {
      ...props,
      href: to,
      onPress: onClick,
      // onMouseEnter,
      ref,
    },
    children
  );
  if (isPending && pending !== undefined) {
    return createElement(Fragment, null, ele, pending);
  }
  if (!isPending && notPending !== undefined) {
    return createElement(Fragment, null, ele, notPending);
  }
  return ele;
}
