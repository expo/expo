import { runOnUI } from '../core';
import { FrameInfo, prepareUIRegistry } from './FrameCallbackRegistryUI';

export default class FrameCallbackRegistryJS {
  private nextCallbackId = 0;

  constructor() {
    prepareUIRegistry();
  }

  registerFrameCallback(callback: (frameInfo: FrameInfo) => void): number {
    if (!callback) {
      return -1;
    }

    const callbackId = this.nextCallbackId;
    this.nextCallbackId++;

    runOnUI(() => {
      'worklet';
      global._frameCallbackRegistry.registerFrameCallback(callback, callbackId);
    })();

    return callbackId;
  }

  unregisterFrameCallback(callbackId: number): void {
    runOnUI(() => {
      'worklet';
      global._frameCallbackRegistry.unregisterFrameCallback(callbackId);
    })();
  }

  manageStateFrameCallback(callbackId: number, state: boolean): void {
    runOnUI(() => {
      'worklet';
      global._frameCallbackRegistry.manageStateFrameCallback(callbackId, state);
    })();
  }
}
