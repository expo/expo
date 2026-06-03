import { useMemo } from 'react';
import { type NavigatorArgs } from 'standard-navigation';

import type { StandardNavigatorEventMapBase } from './types';
import { type EventEmitter } from '../react-navigation/core';

export function useStandardEmitter<NavigatorEventMap extends StandardNavigatorEventMapBase>(
  navigation: EventEmitter<NavigatorEventMap>
): NavigatorArgs<Record<string, never>, NavigatorEventMap>['emitter'] {
  type Emitter = NavigatorArgs<Record<string, never>, NavigatorEventMap>['emitter'];
  type EmitOptions<EventName extends keyof NavigatorEventMap> = Parameters<Emitter['emit']>[0] & {
    type: EventName;
  };
  type EmitResult<EventName extends keyof NavigatorEventMap> = ReturnType<Emitter['emit']> & {
    type: EventName;
  };

  return useMemo<Emitter>(
    () => ({
      emit<EventName extends keyof NavigatorEventMap>(
        options: EmitOptions<EventName>
      ): EmitResult<EventName> {
        // `navigation.emit` constrains the event name to `Extract<keyof EventMap, string>`,
        // but `NavigatorEventMap extends Record<string, …>` already guarantees string keys.
        const result = navigation.emit(options as unknown as Parameters<typeof navigation.emit>[0]);
        const baseEvent = {
          type: options.type,
          data: options.data,
          target: options.target,
        } as unknown as EmitResult<EventName>;
        if ('defaultPrevented' in result) {
          return Object.defineProperties(baseEvent, {
            defaultPrevented: {
              enumerable: true,
              get() {
                return result.defaultPrevented;
              },
            },
            preventDefault: {
              enumerable: true,
              value: result.preventDefault,
            },
          });
        }
        return baseEvent;
      },
    }),
    [navigation]
  );
}
