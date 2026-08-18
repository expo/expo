import { type RefObject, useEffect, useCallback, useRef } from 'react';

import {
  type LinkingOptions,
  getPathFromState as getPathFromStateDefault,
  getStateFromPath as getStateFromPathDefault,
  type NavigationContainerRef,
  type ParamListBase,
  useNavigationIndependentTree,
} from '../react-navigation/native';
import { extractExpoPathFromURL } from './extractPathFromURL';
import { useBrowserHistorySync } from './useBrowserHistorySync';

type ResultState = ReturnType<typeof getStateFromPathDefault>;

const linkingHandlers: symbol[] = [];

type Options = LinkingOptions<ParamListBase>;

export function useLinking(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>,
  options: Options | undefined,
  onUnhandledLinking: (lastUnhandledLining: string | undefined) => void
) {
  const enabled = options !== undefined;
  const prefixes = options?.prefixes ?? [];
  const config = options?.config;
  const getInitialURL = options?.getInitialURL ?? getInitialURLWithTimeout;
  const getStateFromPath = options?.getStateFromPath ?? getStateFromPathDefault;
  const getPathFromState = options?.getPathFromState ?? getPathFromStateDefault;
  const independent = useNavigationIndependentTree();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return undefined;
    }

    if (independent) {
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
  }, [enabled, independent]);

  // We store these options in ref to avoid re-creating getInitialState and re-subscribing listeners
  // This lets user avoid wrapping the items in `React.useCallback` or `React.useMemo`
  // Not re-creating `getInitialState` is important coz it makes it easier for the user to use in an effect
  const enabledRef = useRef(enabled);
  const prefixesRef = useRef(prefixes);
  const configRef = useRef(config);
  const getInitialURLRef = useRef(getInitialURL);
  const getStateFromPathRef = useRef(getStateFromPath);

  useEffect(() => {
    enabledRef.current = enabled;
    prefixesRef.current = prefixes;
    configRef.current = config;
    getInitialURLRef.current = getInitialURL;
    getStateFromPathRef.current = getStateFromPath;
  });

  const getInitialState = useCallback(() => {
    let state: ResultState | undefined;

    if (enabledRef.current) {
      const getStateFromURL = (url: string | null | undefined) => {
        let path = url ? extractExpoPathFromURL(prefixesRef.current, url) : undefined;
        if (path !== undefined && !path.startsWith('/')) {
          path = `/${path}`;
        }

        const state = path ? getStateFromPathRef.current(path, configRef.current) : undefined;

        // If the link were handled, it gets cleared in NavigationContainer
        onUnhandledLinking(path);
        return state;
      };
      const url = getInitialURLRef.current();

      if (typeof url !== 'string' && url != null) {
        return url.then(getStateFromURL);
      }

      state = getStateFromURL(url);
    }

    const thenable = {
      then(onfulfilled?: (state: ResultState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(state) : state);
      },
      catch() {
        return thenable;
      },
    };

    return thenable as PromiseLike<ResultState | undefined>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBrowserHistorySync({
    ref,
    enabled,
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
