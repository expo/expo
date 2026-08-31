'use client';
import * as React from 'react';

import type { EventArg, EventConsumer, EventEmitter } from './types';

export type NavigationEventEmitter<T extends Record<string, any>> = EventEmitter<T> & {
  create: (target: string) => EventConsumer<T>;
};

type Listeners = Set<(e: any) => void>;

/**
 * Hook to manage the event system used by the navigator to notify screens of various events.
 */
export function useEventEmitter<T extends Record<string, any>>(
  listen?: (e: any) => void
): NavigationEventEmitter<T> {
  const listenRef = React.useRef(listen);

  React.useEffect(() => {
    listenRef.current = listen;
  });

  const listeners = React.useRef<Record<string, Record<string, Listeners>>>(Object.create(null));

  const create = React.useCallback((target: string) => {
    const removeListener = (type: string, callback: (data: any) => void) => {
      const callbacks = listeners.current[type] ? listeners.current[type][target] : undefined;

      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);
    };

    const addListener = (type: string, callback: (data: any) => void) => {
      listeners.current[type] = listeners.current[type] || {};
      listeners.current[type][target] = listeners.current[type][target] || new Set();
      listeners.current[type][target].add(callback);

      let removed = false;
      return () => {
        // Prevent removing other listeners when unsubscribing same listener multiple times
        if (!removed) {
          removed = true;
          removeListener(type, callback);
        }
      };
    };

    return {
      addListener,
      removeListener,
    };
  }, []);

  const emit = React.useCallback(
    ({
      type,
      data,
      target,
      canPreventDefault,
      preventDefault,
    }: {
      type: string;
      data?: any;
      target?: string;
      canPreventDefault?: boolean;
      preventDefault?: () => void;
    }) => {
      const items = listeners.current[type] || {};

      // Copy the current list of callbacks in case they are mutated during execution
      const callbacks =
        target !== undefined
          ? [...(items[target] ?? [])]
          : [...new Set(Object.keys(items).flatMap((target) => [...items[target]!]))];

      const event: EventArg<any, any, any> = {
        get type() {
          return type;
        },
      };

      if (target !== undefined) {
        Object.defineProperty(event, 'target', {
          enumerable: true,
          get() {
            return target;
          },
        });
      }

      if (data !== undefined) {
        Object.defineProperty(event, 'data', {
          enumerable: true,
          get() {
            return data;
          },
        });
      }

      if (canPreventDefault) {
        let defaultPrevented = false;

        Object.defineProperties(event, {
          defaultPrevented: {
            enumerable: true,
            get() {
              return defaultPrevented;
            },
          },
          preventDefault: {
            enumerable: true,
            value() {
              defaultPrevented = true;
            },
          },
        });
      } else if (preventDefault) {
        Object.defineProperties(event, {
          defaultPrevented: {
            enumerable: true,
            value: false,
          },
          preventDefault: {
            enumerable: true,
            value: preventDefault,
          },
        });
      }

      listenRef.current?.(event);

      callbacks?.forEach((cb) => cb(event));

      return event as any;
    },
    []
  );

  return React.useMemo(() => ({ create, emit }), [create, emit]);
}
