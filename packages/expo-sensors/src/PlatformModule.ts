import { EventEmitter } from 'expo-core';

export default class PlatformModule {
  emitter = new EventEmitter({ addListener() {}, removeListeners() {} });

  get name(): string {
    throw new Error('PlatformModule.name should be implemented');
  }

  addListener(eventName: string) {}

  removeListeners(count: number) {}

  startObserving() {}

  stopObserving() {}

  async setUpdateInterval(intervalMs: number) {}
}
