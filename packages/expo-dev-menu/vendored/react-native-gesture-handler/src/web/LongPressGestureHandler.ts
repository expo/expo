/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import Hammer from '@egjs/hammerjs';

import { State } from '../State';
import PressGestureHandler from './PressGestureHandler';
import { isnan, isValidNumber } from './utils';
import { Config } from './GestureHandler';
import { HammerInputNames } from './constants';

class LongPressGestureHandler extends PressGestureHandler {
  get minDurationMs(): number {
    // @ts-ignore FIXNE(TS)
    return isnan(this.config.minDurationMs) ? 251 : this.config.minDurationMs;
  }

  get maxDist() {
    // @ts-ignore FIXNE(TS)
    return isnan(this.config.maxDist) ? 9 : this.config.maxDist;
  }

  updateHasCustomActivationCriteria({ maxDistSq }: Config) {
    return !isValidNumber(maxDistSq);
  }

  getConfig() {
    if (!this.hasCustomActivationCriteria) {
      // Default config
      // If no params have been defined then this config should emulate the native gesture as closely as possible.
      return {
        shouldCancelWhenOutside: true,
        maxDistSq: 10,
      };
    }
    return this.config;
  }

  getHammerConfig() {
    return {
      ...super.getHammerConfig(),
      // threshold: this.maxDist,
      time: this.minDurationMs,
    };
  }

  getState(type: keyof typeof HammerInputNames) {
    return {
      [Hammer.INPUT_START]: State.ACTIVE,
      [Hammer.INPUT_MOVE]: State.ACTIVE,
      [Hammer.INPUT_END]: State.END,
      [Hammer.INPUT_CANCEL]: State.FAILED,
    }[type];
  }
}

export default LongPressGestureHandler;
