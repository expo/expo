import type {
  EventEmitter as EventEmitterType,
  EventSubscription,
  EventsMap,
} from '../ts-declarations/EventEmitter';
import type { NativeModule as NativeModuleType } from '../ts-declarations/NativeModule';
import type { SharedObject as SharedObjectType } from '../ts-declarations/SharedObject';
import type { SharedRef as SharedRefType } from '../ts-declarations/SharedRef';

export class EventEmitter<TEventsMap extends EventsMap> implements EventEmitterType {
  private listeners?: Map<keyof TEventsMap, Set<Function>>;

  addListener<EventName extends keyof TEventsMap>(
    eventName: EventName,
    listener: TEventsMap[EventName]
  ): EventSubscription {
    if (!this.listeners) {
      this.listeners = new Map();
    }
    if (!this.listeners?.has(eventName)) {
      this.listeners?.set(eventName, new Set());
    }

    const previousListenerCount = this.listenerCount(eventName);

    this.listeners?.get(eventName)?.add(listener);

    if (previousListenerCount === 0 && this.listenerCount(eventName) === 1) {
      this.startObserving(eventName);
    }

    return {
      remove: () => {
        this.removeListener(eventName, listener);
      },
    };
  }

  removeListener<EventName extends keyof TEventsMap>(
    eventName: EventName,
    listener: TEventsMap[EventName]
  ): void {
    const hasRemovedListener = this.listeners?.get(eventName)?.delete(listener);
    if (this.listenerCount(eventName) === 0 && hasRemovedListener) {
      this.stopObserving(eventName);
    }
  }

  removeAllListeners<EventName extends keyof TEventsMap>(eventName: EventName): void {
    const previousListenerCount = this.listenerCount(eventName);
    this.listeners?.get(eventName)?.clear();
    if (previousListenerCount > 0) {
      this.stopObserving(eventName);
    }
  }

  emit<EventName extends keyof TEventsMap>(
    eventName: EventName,
    ...args: Parameters<TEventsMap[EventName]>
  ): void {
    const listeners = new Set(this.listeners?.get(eventName));

    listeners.forEach((listener) => {
      // When the listener throws an error, don't stop the execution of subsequent listeners and
      // don't propagate the error to the `emit` function. The motivation behind this is that
      // errors thrown from a module or user's code shouldn't affect other modules' behavior.
      try {
        listener(...args);
      } catch (error) {
        console.error(error);
      }
    });
  }

  listenerCount<EventName extends keyof TEventsMap>(eventName: EventName): number {
    return this.listeners?.get(eventName)?.size ?? 0;
  }

  startObserving<EventName extends keyof TEventsMap>(eventName: EventName): void {}

  stopObserving<EventName extends keyof TEventsMap>(eventName: EventName): void {}
}

export class NativeModule<TEventsMap extends Record<never, never>>
  extends EventEmitter<TEventsMap>
  implements NativeModuleType
{
  [key: string]: any;
  ViewPrototype?: object | undefined;
  __expo_module_name__?: string;
}

export class SharedObject<TEventsMap extends Record<never, never>>
  extends EventEmitter<TEventsMap>
  implements SharedObjectType
{
  release(): void {
    // no-op on Web, but subclasses can override it if needed.
  }
}

export class SharedRef<
    TNativeRefType extends string = 'unknown',
    TEventsMap extends EventsMap = Record<never, never>,
  >
  extends SharedObject<TEventsMap>
  implements SharedRefType<TNativeRefType>
{
  nativeRefType: string = 'unknown';
}
