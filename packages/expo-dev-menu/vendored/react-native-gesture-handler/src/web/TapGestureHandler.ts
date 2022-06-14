import Hammer from '@egjs/hammerjs';

import DiscreteGestureHandler from './DiscreteGestureHandler';
import { HammerInputExt } from './GestureHandler';
import { isnan } from './utils';

class TapGestureHandler extends DiscreteGestureHandler {
  private _shouldFireEndEvent: HammerInputExt | null = null;
  private _timer: any;
  private _multiTapTimer: any; // TODO unused?
  get name() {
    return 'tap';
  }

  get NativeGestureClass() {
    return Hammer.Tap;
  }

  get maxDelayMs() {
    // @ts-ignore TODO(TS) trace down config
    return isnan(this.config.maxDelayMs) ? 300 : this.config.maxDelayMs;
  }

  simulateCancelEvent(inputData: HammerInputExt) {
    if (this.isGestureRunning) {
      this.cancelEvent(inputData);
    }
  }

  onGestureActivated(ev: HammerInputExt) {
    if (this.isGestureRunning) {
      this.onSuccessfulTap(ev);
    }
  }

  onSuccessfulTap = (ev: HammerInputExt) => {
    if (this._getPendingGestures().length) {
      this._shouldFireEndEvent = ev;
      return;
    }
    if (ev.eventType === Hammer.INPUT_END) {
      this.sendEvent({ ...ev, eventType: Hammer.INPUT_MOVE });
    }
    // When handler gets activated it will turn into State.END immediately.
    this.sendEvent({ ...ev, isFinal: true });
    this.onGestureEnded(ev);
  };

  onRawEvent(ev: HammerInput) {
    super.onRawEvent(ev);

    // Attempt to create a touch-down event by checking if a valid tap hasn't started yet, then validating the input.
    if (
      !this.hasGestureFailed &&
      !this.isGestureRunning &&
      // Prevent multi-pointer events from misfiring.
      !ev.isFinal
    ) {
      // Tap Gesture start event
      const gesture = this.hammer!.get(this.name);
      // @ts-ignore TODO(TS) trace down config
      if (gesture.options.enable(gesture, ev)) {
        clearTimeout(this._multiTapTimer);

        this.onStart(ev);
        this.sendEvent(ev);
      }
    }
    if (ev.isFinal && ev.maxPointers > 1) {
      setTimeout(() => {
        // Handle case where one finger presses slightly
        // after the first finger on a multi-tap event
        if (this.isGestureRunning) {
          this.cancelEvent(ev);
        }
      });
    }

    if (this.hasGestureFailed) {
      return;
    }
    // Hammer doesn't send a `cancel` event for taps.
    // Manually fail the event.
    if (ev.isFinal) {
      // Handle case where one finger presses slightly
      // after the first finger on a multi-tap event
      if (ev.maxPointers > 1) {
        setTimeout(() => {
          if (this.isGestureRunning) {
            this.cancelEvent(ev);
          }
        });
      }

      // Clear last timer
      clearTimeout(this._timer);
      // Create time out for multi-taps.
      this._timer = setTimeout(() => {
        this.hasGestureFailed = true;
        this.cancelEvent(ev);
      }, this.maxDelayMs);
    } else if (!this.hasGestureFailed && !this.isGestureRunning) {
      // Tap Gesture start event
      const gesture = this.hammer!.get(this.name);
      // @ts-ignore TODO(TS) trace down config
      if (gesture.options.enable(gesture, ev)) {
        clearTimeout(this._multiTapTimer);

        this.onStart(ev);
        this.sendEvent(ev);
      }
    }
  }

  getHammerConfig() {
    return {
      ...super.getHammerConfig(),
      event: this.name,
      // @ts-ignore TODO(TS) trace down config
      taps: isnan(this.config.numberOfTaps) ? 1 : this.config.numberOfTaps,
      interval: this.maxDelayMs,
      time:
        // @ts-ignore TODO(TS) trace down config
        isnan(this.config.maxDurationMs) || this.config.maxDurationMs == null
          ? 250
          : // @ts-ignore TODO(TS) trace down config
            this.config.maxDurationMs,
    };
  }

  updateGestureConfig({
    shouldCancelWhenOutside = true,
    maxDeltaX = Number.NaN,
    maxDeltaY = Number.NaN,
    numberOfTaps = 1,
    minDurationMs = 525,
    maxDelayMs = Number.NaN,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO possibly forgotten to use in updateGestureConfig?
    maxDurationMs = Number.NaN,
    maxDist = 2,
    minPointers = 1,
    maxPointers = 1,
    ...props
  }) {
    return super.updateGestureConfig({
      shouldCancelWhenOutside,
      numberOfTaps,
      maxDeltaX,
      maxDeltaY,
      minDurationMs,
      maxDelayMs,
      maxDist,
      minPointers,
      maxPointers,
      ...props,
    });
  }

  onGestureEnded(...props: any) {
    clearTimeout(this._timer);
    // @ts-ignore TODO(TS) check how onGestureEnded works
    super.onGestureEnded(...props);
  }

  onWaitingEnded(_gesture: any) {
    if (this._shouldFireEndEvent) {
      this.onSuccessfulTap(this._shouldFireEndEvent);
      this._shouldFireEndEvent = null;
    }
  }
}
export default TapGestureHandler;
