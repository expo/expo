/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
interface EventSubscription {
  remove(): void;
}

interface IEventEmitter<TEventToArgsMap extends Record<string, any[]>> {
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => any,
    context?: any
  ): EventSubscription;

  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void;

  removeAllListeners<TEvent extends keyof TEventToArgsMap>(eventType?: TEvent | null): void;

  listenerCount<TEvent extends keyof TEventToArgsMap>(eventType: TEvent): number;
}

interface Registration<TArgs extends any[]> {
  readonly context: any;
  readonly listener: (...args: TArgs) => any;
  readonly remove: () => void;
}

type Registry<TEventToArgsMap extends Record<string, any[]>> = {
  [K in keyof TEventToArgsMap]?: Set<Registration<TEventToArgsMap[K]>>;
};

/**
 * EventEmitter manages listeners and publishes events to them.
 *
 * EventEmitter accepts a single type parameter that defines the valid events
 * and associated listener argument(s).
 *
 * @example
 *
 *   const emitter = new EventEmitter<{
 *     success: [number, string],
 *     error: [Error],
 *   }>();
 *
 *   emitter.on('success', (statusCode, responseText) => {...});
 *   emitter.emit('success', 200, '...');
 *
 *   emitter.on('error', error => {...});
 *   emitter.emit('error', new Error('Resource not found'));
 *
 */
class EventEmitter<TEventToArgsMap extends Record<string, any[]>>
  implements IEventEmitter<TEventToArgsMap>
{
  private _registry: Registry<TEventToArgsMap> = {};

  /**
   * Registers a listener that is called when the supplied event is emitted.
   * Returns a subscription that has a `remove` method to undo registration.
   */
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => any,
    context: any
  ): EventSubscription {
    const registrations = allocate(this._registry, eventType);
    const registration: Registration<TEventToArgsMap[TEvent]> = {
      context,
      listener,
      remove(): void {
        registrations.delete(registration);
      },
    };
    registrations.add(registration);
    return registration;
  }

  /**
   * Emits the supplied event. Additional arguments supplied to `emit` will be
   * passed through to each of the registered listeners.
   *
   * If a listener modifies the listeners registered for the same event, those
   * changes will not be reflected in the current invocation of `emit`.
   */
  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void {
    const registrations = this._registry[eventType];
    if (registrations != null) {
      for (const registration of [...registrations]) {
        registration.listener.apply(registration.context, args);
      }
    }
  }

  /**
   * Removes all registered listeners.
   */
  removeAllListeners<TEvent extends keyof TEventToArgsMap>(eventType?: TEvent | null): void {
    if (eventType == null) {
      this._registry = {};
    } else {
      delete this._registry[eventType];
    }
  }

  /**
   * Returns the number of registered listeners for the supplied event.
   */
  listenerCount<TEvent extends keyof TEventToArgsMap>(eventType: TEvent): number {
    const registrations = this._registry[eventType];
    return registrations == null ? 0 : registrations.size;
  }
}

function allocate<
  TEventToArgsMap extends Record<string, any[]>,
  TEvent extends keyof TEventToArgsMap,
>(
  registry: Registry<TEventToArgsMap>,
  eventType: TEvent
): Set<Registration<TEventToArgsMap[TEvent]>> {
  let registrations = registry[eventType];
  if (registrations == null) {
    registrations = new Set();
    registry[eventType] = registrations;
  }
  return registrations;
}

export default new EventEmitter();
