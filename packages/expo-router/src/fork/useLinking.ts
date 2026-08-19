import { type RefObject, useEffect } from 'react';

import {
  completeParsedState,
  createSeededRootState,
} from '../global-state/createSeededNavigationState';
import { useExpoRouterStore } from '../global-state/storeContext';
import {
  type LinkingOptions,
  getPathFromState as getPathFromStateDefault,
  getStateFromPath as getStateFromPathDefault,
  type NavigationContainerRef,
  type NavigationState,
  type ParamListBase,
} from '../react-navigation/native';
import { ROOT_CHAIN } from '../react-navigation/routers/stateKeys';
import { extractExpoPathFromURL } from './extractPathFromURL';
import { useBrowserHistorySync } from './useBrowserHistorySync';

const linkingHandlers: symbol[] = [];

type Options = LinkingOptions<ParamListBase>;

export function useLinking(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>,
  {
    prefixes,
    config,
    getInitialURL = getInitialURLWithTimeout,
    getStateFromPath = getStateFromPathDefault,
    getPathFromState = getPathFromStateDefault,
  }: Options,
  onUnhandledLinking: (lastUnhandledLining: string | undefined) => void
) {
  const store = useExpoRouterStore();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (linkingHandlers.length) {
      console.error(
        [
          'Looks like you have configured linking in multiple places. This is likely an error since deep links should only be handled in one place to avoid conflicts. Make sure that:',
          "- You don't have multiple NavigationContainers in the app",
          '- Only a single instance of the root component is rendered',
        ]
          .join('\n')
          .trim()
      );
    }

    const handler = Symbol();

    linkingHandlers.push(handler);

    return () => {
      const index = linkingHandlers.indexOf(handler);

      if (index > -1) {
        linkingHandlers.splice(index, 1);
      }
    };
  }, []);

  // `useThenable` only consumes this function from the first render, keeping initialization options consistent.
  const getInitialState = () => {
    const getStateFromURL = (url: string | null | undefined) => {
      let path = url ? extractExpoPathFromURL(prefixes, url) : undefined;
      if (path !== undefined && !path.startsWith('/')) {
        path = `/${path}`;
      }

      const parsedState = path ? getStateFromPath(path, config) : undefined;
      const routeNode = store?.routeNode;
      const state = routeNode
        ? createSeededRootState(parsedState, routeNode)
        : completeParsedState(parsedState, ROOT_CHAIN);

      // If the link were handled, it gets cleared in NavigationContainer
      onUnhandledLinking(path);
      return state;
    };
    const url = getInitialURL();

    if (typeof url !== 'string' && url != null) {
      return url.then(getStateFromURL);
    }

    const state = getStateFromURL(url);

    const thenable = {
      then(onfulfilled?: (state: NavigationState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(state) : state);
      },
      catch() {
        return thenable;
      },
    };

    return thenable as PromiseLike<NavigationState | undefined>;
  };

  useBrowserHistorySync({
    ref,
    config,
    getStateFromPath,
    getPathFromState,
    onUnhandledLinking,
  });

  return {
    getInitialState,
  };
}

export function getInitialURLWithTimeout(): string | null | Promise<string | null> {
  return typeof window === 'undefined' ? '' : window.location.href;
}
