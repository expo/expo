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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = exports.ServerRouter = exports.Router = void 0;
const react_1 = require("react");
const common_js_1 = require("./common.js");
const host_js_1 = require("./host.js");
const normalizeRoutePath = (path) => {
    for (const suffix of ['/', '/index.html']) {
        if (path.endsWith(suffix)) {
            return path.slice(0, -suffix.length) || '/';
        }
    }
    return path;
};
const parseRoute = (url) => {
    if (globalThis.__EXPO_ROUTER_404__) {
        return { path: '/404', query: '', hash: '' };
    }
    const { pathname, searchParams, hash } = url;
    if (searchParams.has(common_js_1.PARAM_KEY_SKIP)) {
        console.warn(`The search param "${common_js_1.PARAM_KEY_SKIP}" is reserved`);
    }
    return {
        path: normalizeRoutePath(pathname),
        query: searchParams.toString(),
        hash,
    };
};
const getHref = () => process.env.EXPO_OS === 'web'
    ? window.location.href
    : // TODO: This is hardcoded on native to simplify the initial PR.
        'http://localhost:8081/';
const RouterContext = (0, react_1.createContext)(null);
const InnerRouter = ({ routerData }) => {
    const refetch = (0, host_js_1.useRefetch)();
    // TODO: strip when "is exporting".
    if (process.env.NODE_ENV === 'development') {
        const refetchRoute = () => {
            const loc = parseRoute(new URL(getHref()));
            const input = (0, common_js_1.getInputString)(loc.path);
            refetch(input, loc.searchParams);
        };
        globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
        const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(globalThis.__EXPO_REFETCH_ROUTE__);
        if (index !== -1) {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
        }
        else {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
        }
        globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
    }
    const initialRouteRef = (0, react_1.useRef)();
    if (!initialRouteRef.current) {
        initialRouteRef.current = parseRoute(new URL(getHref()));
    }
    const [route, setRoute] = (0, react_1.useState)(() => ({
        // This is the first initialization of the route, and it has
        // to ignore the hash, because on server side there is none.
        // Otherwise there will be a hydration error.
        // The client side route, including the hash, will be updated in the effect below.
        ...initialRouteRef.current,
        hash: '',
    }));
    // Update the route post-load to include the current hash.
    (0, react_1.useEffect)(() => {
        const initialRoute = initialRouteRef.current;
        setRoute((prev) => {
            if (prev.path === initialRoute.path &&
                prev.query === initialRoute.query &&
                prev.hash === initialRoute.hash) {
                return prev;
            }
            return initialRoute;
        });
    }, []);
    const componentIds = (0, common_js_1.getComponentIds)(route.path);
    const [cached, setCached] = (0, react_1.useState)(() => {
        return Object.fromEntries(componentIds.map((id) => [id, route]));
    });
    const cachedRef = (0, react_1.useRef)(cached);
    (0, react_1.useEffect)(() => {
        cachedRef.current = cached;
    }, [cached]);
    const changeRoute = (0, react_1.useCallback)((route, options) => {
        const { checkCache, skipRefetch } = options || {};
        (0, react_1.startTransition)(() => {
            setRoute(route);
        });
        const componentIds = (0, common_js_1.getComponentIds)(route.path);
        if (checkCache &&
            componentIds.every((id) => {
                const cachedLoc = cachedRef.current[id];
                return cachedLoc && equalRouteProps(cachedLoc, route);
            })) {
            return; // everything is cached
        }
        const shouldSkip = routerData[0];
        const skip = getSkipList(shouldSkip, componentIds, route, cachedRef.current);
        if (componentIds.every((id) => skip.includes(id))) {
            return; // everything is skipped
        }
        const input = (0, common_js_1.getInputString)(route.path);
        if (!skipRefetch) {
            refetch(input, new URLSearchParams([
                ...Array.from(new URLSearchParams(route.query).entries()),
                ...skip.map((id) => [common_js_1.PARAM_KEY_SKIP, id]),
            ]));
        }
        (0, react_1.startTransition)(() => {
            setCached((prev) => ({
                ...prev,
                ...Object.fromEntries(componentIds.flatMap((id) => (skip.includes(id) ? [] : [[id, route]]))),
            }));
        });
    }, [refetch, routerData]);
    const prefetchRoute = (0, react_1.useCallback)((route) => {
        const componentIds = (0, common_js_1.getComponentIds)(route.path);
        const shouldSkip = routerData[0];
        const skip = getSkipList(shouldSkip, componentIds, route, cachedRef.current);
        if (componentIds.every((id) => skip.includes(id))) {
            return; // everything is cached
        }
        const input = (0, common_js_1.getInputString)(route.path);
        const searchParamsString = new URLSearchParams([
            ...Array.from(new URLSearchParams(route.query).entries()),
            ...skip.map((id) => [common_js_1.PARAM_KEY_SKIP, id]),
        ]).toString();
        (0, host_js_1.prefetchRSC)(input, searchParamsString);
        globalThis.__WAKU_ROUTER_PREFETCH__?.(route.path);
    }, [routerData]);
    (0, react_1.useEffect)(() => {
        const callback = () => {
            const route = parseRoute(new URL(window.location.href));
            changeRoute(route, { checkCache: true });
        };
        window.addEventListener('popstate', callback);
        return () => {
            window.removeEventListener('popstate', callback);
        };
    }, [changeRoute]);
    (0, react_1.useEffect)(() => {
        const callback = (pathname, searchParamsString) => {
            const url = new URL(window.location.href);
            url.pathname = pathname;
            url.search = searchParamsString;
            url.hash = '';
            window.history.pushState({
                ...window.history.state,
                waku_new_path: url.pathname !== window.location.pathname,
            }, '', url);
            changeRoute(parseRoute(url), { skipRefetch: true });
        };
        const listeners = (routerData[1] ||= new Set());
        listeners.add(callback);
        return () => {
            listeners.delete(callback);
        };
    }, [changeRoute, routerData]);
    (0, react_1.useEffect)(() => {
        const { hash } = window.location;
        const { state } = window.history;
        const element = hash && document.getElementById(hash.slice(1));
        window.scrollTo({
            left: 0,
            top: element ? element.getBoundingClientRect().top + window.scrollY : 0,
            behavior: state?.waku_new_path ? 'instant' : 'auto',
        });
    });
    const children = componentIds.reduceRight((acc, id) => (0, react_1.createElement)(RouterSlot, { route, routerData, cachedRef, id, fallback: acc }, acc), null);
    return (0, react_1.createElement)(RouterContext.Provider, { value: { route, changeRoute, prefetchRoute } }, children);
};
const RouterSlot = ({ route, routerData, cachedRef, id, fallback, children, }) => {
    const unstable_shouldRenderPrev = (_err) => {
        const shouldSkip = routerData[0];
        const skip = getSkipList(shouldSkip, [id], route, cachedRef.current);
        return skip.length > 0;
    };
    return (0, react_1.createElement)(host_js_1.Slot, { id, fallback, unstable_shouldRenderPrev }, children);
};
const getSkipList = (shouldSkip, componentIds, route, cached) => {
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
const DEFAULT_ROUTER_DATA = [];
function Router({ routerData = DEFAULT_ROUTER_DATA }) {
    const route = parseRoute(new URL(getHref()));
    const initialInput = (0, common_js_1.getInputString)(route.path);
    const initialSearchParamsString = route.query;
    const unstable_onFetchData = () => { };
    return (0, react_1.createElement)(host_js_1.Root, { initialInput, initialSearchParamsString, unstable_onFetchData }, (0, react_1.createElement)(InnerRouter, { routerData }));
}
exports.Router = Router;
const notAvailableInServer = (name) => () => {
    throw new Error(`${name} is not in the server`);
};
/**
 * ServerRouter for SSR
 * This is not a public API.
 */
function ServerRouter({ children, route }) {
    return (0, react_1.createElement)(react_1.Fragment, null, (0, react_1.createElement)(RouterContext.Provider, {
        value: {
            route,
            changeRoute: notAvailableInServer('changeRoute'),
            prefetchRoute: notAvailableInServer('prefetchRoute'),
        },
    }, children));
}
exports.ServerRouter = ServerRouter;
function Link({ href: to, children, pending, notPending, unstable_prefetchOnEnter, unstable_prefetchOnView, ...props }) {
    const router = (0, react_1.useContext)(RouterContext);
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
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const ref = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        if (unstable_prefetchOnView && ref.current) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const url = new URL(to, window.location.href);
                        if (router && url.href !== window.location.href) {
                            const route = parseRoute(url);
                            router.prefetchRoute(route);
                        }
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(ref.current);
            return () => {
                observer.disconnect();
            };
        }
    }, [unstable_prefetchOnView, router, to]);
    const onClick = (event) => {
        event.preventDefault();
        const url = new URL(to, window.location.href);
        if (url.href !== window.location.href) {
            const route = parseRoute(url);
            prefetchRoute(route);
            startTransition(() => {
                window.history.pushState({
                    ...window.history.state,
                    waku_new_path: url.pathname !== window.location.pathname,
                }, '', url);
                changeRoute(route);
            });
        }
        props.onClick?.(event);
    };
    const onMouseEnter = unstable_prefetchOnEnter
        ? (event) => {
            const url = new URL(to, window.location.href);
            if (url.href !== window.location.href) {
                const route = parseRoute(url);
                prefetchRoute(route);
            }
            props.onMouseEnter?.(event);
        }
        : props.onMouseEnter;
    const ele = (0, react_1.createElement)('a', { ...props, href: to, onClick, onMouseEnter, ref }, children);
    if (isPending && pending !== undefined) {
        return (0, react_1.createElement)(react_1.Fragment, null, ele, pending);
    }
    if (!isPending && notPending !== undefined) {
        return (0, react_1.createElement)(react_1.Fragment, null, ele, notPending);
    }
    return ele;
}
exports.Link = Link;
//# sourceMappingURL=client.js.map