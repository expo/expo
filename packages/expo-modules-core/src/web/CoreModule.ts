import type { EventEmitter as EventEmitterType } from '../ts-declarations/EventEmitter';
import type { NativeModule as NativeModuleType } from '../ts-declarations/NativeModule';
import type { SharedObject as SharedObjectType } from '../ts-declarations/SharedObject';
import uuid from '../uuid';

class EventEmitter<TEventsMap extends Record<never, never>> implements EventEmitterType {
  private listeners?: Map<keyof TEventsMap, Set<Function>>;

  removeListener<EventName extends keyof TEventsMap>(
    eventName: EventName,
    listener: TEventsMap[EventName]
  ): void {
    this.listeners?.get(eventName)?.delete(listener);
  }
  removeAllListeners<EventName extends keyof TEventsMap>(eventName: EventName): void {
    this.listeners?.get(eventName)?.clear();
  }
  emit<EventName extends keyof TEventsMap>(
    eventName: EventName,
    ...args: Parameters<TEventsMap[EventName]>
  ): void {
    this.listeners?.get(eventName)?.forEach((listener) => listener(...args));
  }
  addListener<EventName extends keyof TEventsMap>(
    eventName: EventName,
    listener: TEventsMap[EventName]
  ): void {
    if (!this.listeners) {
      this.listeners = new Map();
    }
    if (!this.listeners?.has(eventName)) {
      this.listeners?.set(eventName, new Set());
    }
    this.listeners?.get(eventName)?.add(listener);
  }
}

class NativeModule<TEventsMap extends Record<never, never>>
  extends EventEmitter<TEventsMap>
  implements NativeModuleType
{
  [key: string]: any;
  ViewPrototype?: object | undefined;
  __expo_module_name__?: string;
}

class SharedObject<TEventsMap extends Record<never, never>>
  extends EventEmitter<TEventsMap>
  implements SharedObjectType
{
  release(): void {
    throw new Error('Method not implemented.');
  }
}

globalThis.expo = {
  EventEmitter,
  NativeModule,
  SharedObject,
  modules: {},
  uuidv4: uuid.v4,
  uuidv5: uuid.v5,
  getViewConfig: () => {
    throw new Error('Method not implemented.');
  },
};
