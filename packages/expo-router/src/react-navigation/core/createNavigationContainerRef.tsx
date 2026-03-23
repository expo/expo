import { CommonActions } from '@react-navigation/routers';

import type {
  NavigationContainerEventMap,
  NavigationContainerRef,
  NavigationContainerRefWithCurrent,
} from './types';

export const NOT_INITIALIZED_ERROR =
  "The 'navigation' object hasn't been initialized yet. This might happen if you don't have a navigator mounted, or if the navigator hasn't finished mounting. See https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization for more details.";

export function createNavigationContainerRef<
  ParamList extends {} = ReactNavigation.RootParamList,
>(): NavigationContainerRefWithCurrent<ParamList> {
  const methods = [
    ...Object.keys(CommonActions),
    'addListener',
    'removeListener',
    'resetRoot',
    'dispatch',
    'isFocused',
    'canGoBack',
    'getRootState',
    'getState',
    'getParent',
    'getCurrentRoute',
    'getCurrentOptions',
  ] as const;

  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  const removeListener = (
    event: string,
    callback: (...args: any[]) => void
  ) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    }
  };

  let current: NavigationContainerRef<ParamList> | null = null;

  const ref: NavigationContainerRefWithCurrent<ParamList> = {
    get current() {
      return current;
    },
    set current(value: NavigationContainerRef<ParamList> | null) {
      current = value;

      if (value != null) {
        Object.entries(listeners).forEach(([event, callbacks]) => {
          callbacks.forEach((callback) => {
            value.addListener(
              event as keyof NavigationContainerEventMap,
              callback
            );
          });
        });
      }
    },
    isReady: () => {
      if (current == null) {
        return false;
      }

      return current.isReady();
    },
    ...methods.reduce<any>((acc, name) => {
      acc[name] = (...args: any[]) => {
        if (current == null) {
          switch (name) {
            case 'addListener': {
              const [event, callback] = args;

              listeners[event] = listeners[event] || [];
              listeners[event].push(callback);

              return () => removeListener(event, callback);
            }
            case 'removeListener': {
              const [event, callback] = args;

              removeListener(event, callback);
              break;
            }
            default:
              console.error(NOT_INITIALIZED_ERROR);
          }
        } else {
          // @ts-expect-error: this is ok
          return current[name](...args);
        }
      };
      return acc;
    }, {}),
  };

  return ref;
}
