import { runOnUI } from '../core';
import { prepareUIRegistry } from './FrameCallbackRegistryUI';

export default class FrameCallbackRegistryJS {
  private nextCallbackId = 0;

  constructor() {
    prepareUIRegistry();
  }

  registerFrameCallback(callback: () => void): number {
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

  unregisterFrameCallback(frameCallbackId: number): void {
    runOnUI(() => {
      'worklet';
      global._frameCallbackRegistry.unregisterFrameCallback(frameCallbackId);
    })();
  }

  manageStateFrameCallback(frameCallbackId: number, state: boolean): void {
    runOnUI(() => {
      'worklet';
      global._frameCallbackRegistry.manageStateFrameCallback(
        frameCallbackId,
        state
      );
    })();
  }
}
