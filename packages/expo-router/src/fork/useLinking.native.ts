import { type RefObject, useEffect, useEffectEvent, useCallback, useRef } from 'react';
import { Linking } from 'react-native';

import {
  completeParsedState,
  createSeededRootState,
} from '../global-state/createSeededNavigationState';
import { routingQueue } from '../global-state/routingQueue';
import { useExpoRouterStore } from '../global-state/storeContext';
import { useRouteInfo } from '../global-state/useRouteInfo';
import {
  type LinkingOptions,
  type NavigationContainerRef,
  type NavigationState,
  type ParamListBase,
} from '../react-navigation/native';
import { extractExpoPathFromURL } from './extractPathFromURL';
import { getInitialURLWithTimeout } from './getInitialURLWithTimeout';
import { getStateFromPath as getExpoStateFromPath } from './getStateFromPath';

type Options = LinkingOptions<ParamListBase>;

const linkingHandlers: symbol[] = [];

function getInitialPath(prefixes: string[], url: string) {
  const path = extractExpoPathFromURL(prefixes, url);
  return path.startsWith('/') ? path : `/${path}`;
}

export function useLinking(
  ref: RefObject<NavigationContainerRef<ParamListBase>>,
  options: Options | undefined,
  onUnhandledLinking: (lastUnhandledLining: string | undefined) => void
) {
  const enabled = options !== undefined;
  const prefixes = options?.prefixes ?? [];
  const filter = options?.filter;
  const config = options?.config;
  const getInitialURL = options?.getInitialURL ?? (() => getInitialURLWithTimeout());
  const subscribe =
    options?.subscribe ??
    ((listener) => {
      const callback = ({ url }: { url: string }) => listener(url);

      const subscription = Linking.addEventListener('url', callback) as
        | { remove(): void }
        | undefined;

      // Storing this in a local variable stops Jest from complaining about import after teardown
      // @ts-expect-error: removeEventListener is not present in newer RN versions
      const removeEventListener = Linking.removeEventListener?.bind(Linking);

      return () => {
        // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
        if (subscription?.remove) {
          subscription.remove();
        } else {
          removeEventListener?.('url', callback);
        }
      };
    });
  const getStateFromPath = options?.getStateFromPath ?? getExpoStateFromPath;
  const { segments } = useRouteInfo();
  const store = useExpoRouterStore();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (enabled && linkingHandlers.length) {
      console.error(
        [
          'Looks like you have configured linking in multiple places. This is likely an error since deep links should only be handled in one place to avoid conflicts. Make sure that:',
          "- You don't have multiple NavigationContainers in the app each with 'linking' enabled",
          '- Only a single instance of the root component is rendered',
        ]
          .join('\n')
          .trim()
      );
    }

    const handler = Symbol();

    if (enabled) {
      linkingHandlers.push(handler);
    }

    return () => {
      const index = linkingHandlers.indexOf(handler);

      if (index > -1) {
        linkingHandlers.splice(index, 1);
      }
    };
  }, [enabled]);

  // We store these options in refs to keep getInitialState stable across renders.
  const prefixesRef = useRef(prefixes);
  const filterRef = useRef(filter);
  const configRef = useRef(config);
  const getStateFromPathRef = useRef(getStateFromPath);

  useEffect(() => {
    prefixesRef.current = prefixes;
    filterRef.current = filter;
    configRef.current = config;
    getStateFromPathRef.current = getStateFromPath;
  });

  const getStateFromURL = useCallback(
    // TODO: This may no longer be necessary. It was added during the initial-state refactor to preserve the previous path shape.
    (url: string | null | undefined, initial = false) => {
      if (!url || (filterRef.current && !filterRef.current(url))) {
        return undefined;
      }

      const path = initial
        ? getInitialPath(prefixesRef.current, url)
        : extractExpoPathFromURL(prefixesRef.current, url);

      return path !== undefined
        ? getStateFromPathRef.current(path, configRef.current, segments)
        : undefined;
    },

    [segments]
  );
  const getStateFromURLInEffect = useEffectEvent(getStateFromURL);

  const getInitialState = useCallback(() => {
    let state: NavigationState | undefined;

    if (enabled) {
      const url = getInitialURL();
      const createInitialState = (url: string | null | undefined) => {
        let parsedState;
        if (url && (!filter || filter(url))) {
          const path = getInitialPath(prefixes, url);
          parsedState = getStateFromPath(path, config);
        }

        const routeNode = store?.routeNode;
        return routeNode
          ? createSeededRootState(parsedState, routeNode)
          : completeParsedState(parsedState);
      };

      if (url != null) {
        if (typeof url !== 'string') {
          return url.then((url) => {
            const state = createInitialState(url);

            if (typeof url === 'string') {
              // If the link were handled, it gets cleared in NavigationContainer
              onUnhandledLinking(getInitialPath(prefixes, url));
            }

            return state;
          });
        } else {
          onUnhandledLinking(getInitialPath(prefixes, url));
        }
      }

      state = createInitialState(url);
    }

    const thenable = {
      then(onfulfilled?: (state: NavigationState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(state) : state);
      },
      catch() {
        return thenable;
      },
    };

    return thenable as PromiseLike<NavigationState | undefined>;
  }, [
    config,
    enabled,
    filter,
    getInitialURL,
    getStateFromPath,
    onUnhandledLinking,
    prefixes,
    store,
  ]);

  useEffect(() => {
    const listener = (url: string) => {
      if (!enabled) {
        return;
      }

      const navigation = ref.current;
      const path = extractExpoPathFromURL(prefixes, url);
      const state = navigation && path !== undefined ? getStateFromURLInEffect(url) : undefined;

      if (navigation && state) {
        // If the link were handled, it gets cleared in NavigationContainer
        onUnhandledLinking(path);
        const rootState = navigation.getRootState();
        if (state.routes.some((r) => !rootState?.routeNames.includes(r.name))) {
          return;
        }

        routingQueue.add({
          type: 'NAVIGATE_TO_HREF',
          payload: {
            href: path.startsWith('/') ? path : `/${path}`,
            originalHref: url,
            options: { event: 'NAVIGATE' },
          },
        });
      }
    };

    return subscribe(listener);
  }, [enabled, onUnhandledLinking, prefixes, ref, subscribe]);

  return {
    getInitialState,
  };
}
