import { runOnUI } from '../core';

type CallbackDetails = {
  callback: (frameInfo: FrameInfo) => void;
  startTime: number | null;
};

export type FrameInfo = {
  timestamp: number;
  timeSincePreviousFrame: number | null;
  timeSinceFirstFrame: number;
};

export interface FrameCallbackRegistryUI {
  frameCallbackRegistry: Map<number, CallbackDetails>;
  activeFrameCallbacks: Set<number>;
  previousFrameTimestamp: number | null;
  runCallbacks: () => void;
  registerFrameCallback: (
    callback: (frameInfo: FrameInfo) => void,
    callbackId: number
  ) => void;
  unregisterFrameCallback: (callbackId: number) => void;
  manageStateFrameCallback: (callbackId: number, state: boolean) => void;
}

export const prepareUIRegistry = runOnUI(() => {
  'worklet';

  const frameCallbackRegistry: FrameCallbackRegistryUI = {
    frameCallbackRegistry: new Map<number, CallbackDetails>(),
    activeFrameCallbacks: new Set<number>(),
    previousFrameTimestamp: null,

    runCallbacks() {
      const loop = (timestamp: number) => {
        if (this.previousFrameTimestamp === null) {
          this.previousFrameTimestamp = timestamp;
        }

        const delta = timestamp - this.previousFrameTimestamp;

        this.activeFrameCallbacks.forEach((callbackId: number) => {
          const callbackDetails = this.frameCallbackRegistry.get(callbackId)!;

          const { startTime } = callbackDetails;

          if (startTime === null) {
            // First frame
            callbackDetails.startTime = timestamp;

            callbackDetails.callback({
              timestamp,
              timeSincePreviousFrame: null,
              timeSinceFirstFrame: 0,
            });
          } else {
            // Next frame
            callbackDetails.callback({
              timestamp,
              timeSincePreviousFrame: delta,
              timeSinceFirstFrame: timestamp - startTime,
            });
          }
        });

        if (this.activeFrameCallbacks.size > 0) {
          this.previousFrameTimestamp = timestamp;
          requestAnimationFrame(loop);
        } else {
          this.previousFrameTimestamp = null;
        }
      };

      // runCallback() should only be called after registering a callback,
      // so if there is only one active callback, then it means that there were
      // zero previously and the loop isn't running yet.
      if (this.activeFrameCallbacks.size === 1) {
        requestAnimationFrame(loop);
      }
    },

    registerFrameCallback(
      callback: (frameInfo: FrameInfo) => void,
      callbackId: number
    ) {
      this.frameCallbackRegistry.set(callbackId, {
        callback: callback,
        startTime: null,
      });
    },

    unregisterFrameCallback(callbackId: number) {
      this.manageStateFrameCallback(callbackId, false);
      this.frameCallbackRegistry.delete(callbackId);
    },

    manageStateFrameCallback(callbackId: number, state: boolean) {
      if (callbackId === -1) {
        return;
      }
      if (state) {
        this.activeFrameCallbacks.add(callbackId);
        this.runCallbacks();
      } else {
        const callback = this.frameCallbackRegistry.get(callbackId)!;
        callback.startTime = null;

        this.activeFrameCallbacks.delete(callbackId);
      }
    },
  };

  global._frameCallbackRegistry = frameCallbackRegistry;
});
