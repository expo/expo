import { ExpoGlobal } from '..';
import { EventEmitter } from '../ts-declarations/EventEmitter';
import { NativeModule } from '../ts-declarations/NativeModule';
import { SharedObject } from '../ts-declarations/SharedObject';
import uuid from '../uuid';

class WebEventEmitter implements EventEmitter {
  private listeners: Map<string, Set<Function>>;

  constructor() {
    this.listeners = new Map();
  }

  removeListener<EventName extends never>(
    eventName: EventName,
    listener: Record<never, never>[EventName]
  ): void {
    this.listeners.get(eventName)?.delete(listener);
  }
  removeAllListeners(eventName: never): void {
    this.listeners.get(eventName)?.clear();
  }
  emit<EventName extends never>(
    eventName: EventName,
    ...args: Parameters<Record<never, never>[EventName]>
  ): void {
    this.listeners.get(eventName)?.forEach((listener) => listener(...args));
  }
  addListener<EventName extends never>(
    eventName: EventName,
    listener: Record<never, never>[EventName]
  ): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(listener);
  }
}

class CoreObject implements ExpoGlobal {
  modules: Record<string, any>;
  EventEmitter: typeof WebEventEmitter;
  SharedObject: typeof SharedObject;
  NativeModule: typeof NativeModule;
  constructor() {
    this.modules = {};
    this.SharedObject = SharedObject;
    this.NativeModule = NativeModule;
    this.EventEmitter = WebEventEmitter;
  }

  getViewConfig(viewName: string): {
    validAttributes: Record<string, any>;
    directEventTypes: Record<string, { registrationName: string }>;
  } | null {
    throw new Error('Method not implemented.');
  }
  uuidv4() {
    return uuid.v4();
  }
  uuidv5(name: string, namespace: string | number[]) {
    return uuid.v5(name, namespace);
  }
}

globalThis.expo = new CoreObject();

export default CoreObject;
