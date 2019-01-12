import { EventEmitter } from 'expo-core';

export default class PlatformSensorModule {
  emitter = new EventEmitter({} as any);

  _updateInterval: number = 0;

  get name(): string {
    throw new Error('PlatformSensorModule.name should be implemented');
  }

  async isAvailableAsync(): Promise<boolean> {
    return false;
  }

  addListener = (eventName: string): void => {};

  removeListeners = (count: number): void => {};

  startObserving = (): void => {};

  stopObserving = (): void => {};

  setUpdateInterval = async (intervalMs: number): Promise<void> => {
    this._updateInterval = intervalMs;
  };
}
