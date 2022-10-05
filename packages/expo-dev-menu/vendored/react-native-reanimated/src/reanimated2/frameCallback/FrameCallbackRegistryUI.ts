import { runOnUI } from '../core';

export default interface FrameCallbackRegistryUI {
  frameCallbackRegistry: Map<number, () => void>;
  frameCallbackActive: Set<number>;
  isFrameCallbackRunning: boolean;
  runCallbacks: () => void;
  registerFrameCallback: (callback: () => void, callbackId: number) => void;
  unregisterFrameCallback: (frameCallbackId: number) => void;
  manageStateFrameCallback: (frameCallbackId: number, state: boolean) => void;
}

export const prepareUIRegistry = runOnUI(() => {
  'worklet';

  const frameCallbackRegistry: FrameCallbackRegistryUI = {
    frameCallbackRegistry: new Map<number, () => void>(),
    frameCallbackActive: new Set<number>(),
    isFrameCallbackRunning: false,

    runCallbacks() {
      const loop = () => {
        this.frameCallbackActive.forEach((key: number) => {
          const callback = this.frameCallbackRegistry.get(key);
          callback!();
        });

        if (this.frameCallbackActive.size > 0) {
          requestAnimationFrame(loop);
        } else {
          this.isFrameCallbackRunning = false;
        }
      };

      if (!this.isFrameCallbackRunning) {
        requestAnimationFrame(loop);
        this.isFrameCallbackRunning = true;
      }
    },

    registerFrameCallback(callback: () => void, callbackId: number) {
      this.frameCallbackRegistry.set(callbackId, callback);
    },

    unregisterFrameCallback(frameCallbackId: number) {
      this.manageStateFrameCallback(frameCallbackId, false);
      this.frameCallbackRegistry.delete(frameCallbackId);
    },

    manageStateFrameCallback(frameCallbackId: number, state: boolean) {
      if (frameCallbackId === -1) {
        return;
      }
      if (state) {
        this.frameCallbackActive.add(frameCallbackId);
        this.runCallbacks();
      } else {
        this.frameCallbackActive.delete(frameCallbackId);
      }
    },
  };

  global._frameCallbackRegistry = frameCallbackRegistry;
});
