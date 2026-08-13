import { type RefObject, useEffect, useCallback, useRef, use } from 'react';

import { ServerContext } from '../global-state/serverLocationContext';
import {
  type LinkingOptions,
  getPathFromState as getPathFromStateDefault,
  getStateFromPath as getStateFromPathDefault,
  type NavigationContainerRef,
  type ParamListBase,
} from '../react-navigation/native';
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
  const config = options?.config;
  const getStateFromPath = options?.getStateFromPath ?? getStateFromPathDefault;
  const getPathFromState = options?.getPathFromState ?? getPathFromStateDefault;

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

  // We store these options in ref to avoid re-creating getInitialState and re-subscribing listeners
  // This lets user avoid wrapping the items in `React.useCallback` or `React.useMemo`
  // Not re-creating `getInitialState` is important coz it makes it easier for the user to use in an effect
  const enabledRef = useRef(enabled);
  const configRef = useRef(config);
  const getStateFromPathRef = useRef(getStateFromPath);

  useEffect(() => {
    enabledRef.current = enabled;
    configRef.current = config;
    getStateFromPathRef.current = getStateFromPath;
  });

  const server = use(ServerContext);

  const getInitialState = useCallback(() => {
    let value: ResultState | undefined;

    if (enabledRef.current) {
      const location =
        server?.location ?? (typeof window !== 'undefined' ? window.location : undefined);

      const path = location
        ? location.pathname + location.search + (location.hash ?? '')
        : undefined;

      if (path) {
        value = getStateFromPathRef.current(path, configRef.current);
      }

      // If the link were handled, it gets cleared in NavigationContainer
      onUnhandledLinking(path);
    }

    const thenable = {
      then(onfulfilled?: (state: ResultState | undefined) => void) {
        return Promise.resolve(onfulfilled ? onfulfilled(value) : value);
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
