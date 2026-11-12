import { type RefObject, use, useEffect } from 'react';

import {
  completeParsedState,
  createSeededRootState,
} from '../global-state/createSeededNavigationState';
import { RouterConfigContext } from '../global-state/routerConfigContext';
import { withLoadedLayouts } from '../layoutAnchor';
import {
  type LinkingOptions,
  getStateFromPath as getStateFromPathDefault,
  type NavigationContainerRef,
  type ParamListBase,
} from '../react-navigation/native';
import { ROOT_CHAIN } from '../react-navigation/routers/stateKeys';
import { extractExpoPathFromURL } from './extractPathFromURL';

const linkingHandlers: symbol[] = [];

type Options = LinkingOptions<ParamListBase>;

export function useLinking(
  _ref: RefObject<NavigationContainerRef<ParamListBase> | null>,
  {
    prefixes,
    config,
    getInitialURL = getInitialURLWithTimeout,
    getStateFromPath = getStateFromPathDefault,
  }: Options
) {
  const routerConfig = use(RouterConfigContext);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (linkingHandlers.length) {
      console.warn(
        'Two Expo Router roots handle deep links at the same time. This is expected for a moment during an Android Activity relaunch. At other times, make sure that the app renders only one root component.'
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

  // `NavigationContainer` only consumes this function from the first render, keeping initialization options consistent.
  const getInitialState = () => {
    const getStateFromURL = (url: string | null | undefined) => {
      let path = url ? extractExpoPathFromURL(prefixes, url) : undefined;
      if (path !== undefined && !path.startsWith('/')) {
        path = `/${path}`;
      }

      const parsedState = path ? getStateFromPath(path, config) : undefined;
      const routeNode = routerConfig?.routeNode;
      return routeNode
        ? withLoadedLayouts(() => createSeededRootState(parsedState, routeNode))
        : completeParsedState(parsedState, ROOT_CHAIN);
    };
    const url = getInitialURL();

    if (typeof url !== 'string' && url != null) {
      return url.then(getStateFromURL);
    }

    return getStateFromURL(url);
  };

  return {
    getInitialState,
  };
}

export function getInitialURLWithTimeout(): string | null | Promise<string | null> {
  return typeof window === 'undefined' ? '' : window.location.href;
}
