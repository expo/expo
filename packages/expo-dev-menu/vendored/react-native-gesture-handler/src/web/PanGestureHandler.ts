import Hammer from '@egjs/hammerjs';

import {
  EventMap,
  MULTI_FINGER_PAN_MAX_PINCH_THRESHOLD,
  MULTI_FINGER_PAN_MAX_ROTATION_THRESHOLD,
} from './constants';
import DraggingGestureHandler from './DraggingGestureHandler';
import { isValidNumber, isnan, TEST_MIN_IF_NOT_NAN, VEC_LEN_SQ } from './utils';
import { State } from '../State';

import { Config, HammerInputExt } from './GestureHandler';
class PanGestureHandler extends DraggingGestureHandler {
  get name() {
    return 'pan';
  }

  get NativeGestureClass() {
    return Hammer.Pan;
  }

  getHammerConfig() {
    return {
      ...super.getHammerConfig(),
      direction: this.getDirection(),
    };
  }

  getState(type: keyof typeof EventMap) {
    const nextState = super.getState(type);
    // Ensure that the first state sent is `BEGAN` and not `ACTIVE`
    if (
      this.previousState === State.UNDETERMINED &&
      nextState === State.ACTIVE
    ) {
      return State.BEGAN;
    }
    return nextState;
  }

  getDirection() {
    const config = this.getConfig();
    const {
      activeOffsetXStart,
      activeOffsetXEnd,
      activeOffsetYStart,
      activeOffsetYEnd,
      minDist,
    } = config;
    let directions: number[] = [];
    let horizontalDirections = [];

    if (!isnan(minDist)) {
      return Hammer.DIRECTION_ALL;
    }

    if (!isnan(activeOffsetXStart))
      horizontalDirections.push(Hammer.DIRECTION_LEFT);
    if (!isnan(activeOffsetXEnd))
      horizontalDirections.push(Hammer.DIRECTION_RIGHT);
    if (horizontalDirections.length === 2)
      horizontalDirections = [Hammer.DIRECTION_HORIZONTAL];

    directions = directions.concat(horizontalDirections);
    let verticalDirections = [];

    if (!isnan(activeOffsetYStart))
      verticalDirections.push(Hammer.DIRECTION_UP);
    if (!isnan(activeOffsetYEnd))
      verticalDirections.push(Hammer.DIRECTION_DOWN);

    if (verticalDirections.length === 2)
      verticalDirections = [Hammer.DIRECTION_VERTICAL];

    directions = directions.concat(verticalDirections);

    if (!directions.length) {
      return Hammer.DIRECTION_NONE;
    }
    if (
      directions[0] === Hammer.DIRECTION_HORIZONTAL &&
      directions[1] === Hammer.DIRECTION_VERTICAL
    ) {
      return Hammer.DIRECTION_ALL;
    }
    if (horizontalDirections.length && verticalDirections.length) {
      return Hammer.DIRECTION_ALL;
    }

    return directions[0];
  }

  getConfig() {
    if (!this.hasCustomActivationCriteria) {
      // Default config
      // If no params have been defined then this config should emulate the native gesture as closely as possible.
      return {
        minDistSq: 10,
      };
    }
    return this.config;
  }

  shouldFailUnderCustomCriteria(
    { deltaX, deltaY }: HammerInputExt,
    criteria: any
  ) {
    return (
      (!isnan(criteria.failOffsetXStart) &&
        deltaX < criteria.failOffsetXStart) ||
      (!isnan(criteria.failOffsetXEnd) && deltaX > criteria.failOffsetXEnd) ||
      (!isnan(criteria.failOffsetYStart) &&
        deltaY < criteria.failOffsetYStart) ||
      (!isnan(criteria.failOffsetYEnd) && deltaY > criteria.failOffsetYEnd)
    );
  }

  shouldActivateUnderCustomCriteria(
    { deltaX, deltaY, velocity }: any,
    criteria: any
  ) {
    return (
      (!isnan(criteria.activeOffsetXStart) &&
        deltaX < criteria.activeOffsetXStart) ||
      (!isnan(criteria.activeOffsetXEnd) &&
        deltaX > criteria.activeOffsetXEnd) ||
      (!isnan(criteria.activeOffsetYStart) &&
        deltaY < criteria.activeOffsetYStart) ||
      (!isnan(criteria.activeOffsetYEnd) &&
        deltaY > criteria.activeOffsetYEnd) ||
      TEST_MIN_IF_NOT_NAN(
        VEC_LEN_SQ({ x: deltaX, y: deltaY }),
        criteria.minDistSq
      ) ||
      TEST_MIN_IF_NOT_NAN(velocity.x, criteria.minVelocityX) ||
      TEST_MIN_IF_NOT_NAN(velocity.y, criteria.minVelocityY) ||
      TEST_MIN_IF_NOT_NAN(VEC_LEN_SQ(velocity), criteria.minVelocitySq)
    );
  }

  shouldMultiFingerPanFail({
    pointerLength,
    scale,
    deltaRotation,
  }: {
    deltaRotation: number;
    pointerLength: number;
    scale: number;
  }) {
    if (pointerLength <= 1) {
      return false;
    }

    // Test if the pan had too much pinching or rotating.
    const deltaScale = Math.abs(scale - 1);
    const absDeltaRotation = Math.abs(deltaRotation);
    if (deltaScale > MULTI_FINGER_PAN_MAX_PINCH_THRESHOLD) {
      // > If the threshold doesn't seem right.
      // You can log the value which it failed at here:
      return true;
    }
    if (absDeltaRotation > MULTI_FINGER_PAN_MAX_ROTATION_THRESHOLD) {
      // > If the threshold doesn't seem right.
      // You can log the value which it failed at here:
      return true;
    }

    return false;
  }

  updateHasCustomActivationCriteria(
    criteria: Config & { minVelocityX?: number; minVelocityY?: number }
  ) {
    return (
      isValidNumber(criteria.minDistSq) ||
      isValidNumber(criteria.minVelocityX) ||
      isValidNumber(criteria.minVelocityY) ||
      isValidNumber(criteria.minVelocitySq) ||
      isValidNumber(criteria.activeOffsetXStart) ||
      isValidNumber(criteria.activeOffsetXEnd) ||
      isValidNumber(criteria.activeOffsetYStart) ||
      isValidNumber(criteria.activeOffsetYEnd)
    );
  }

  isGestureEnabledForEvent(
    props: any,
    _recognizer: any,
    inputData: HammerInputExt & { deltaRotation: number }
  ) {
    if (this.shouldFailUnderCustomCriteria(inputData, props)) {
      return { failed: true };
    }

    const velocity = { x: inputData.velocityX, y: inputData.velocityY };
    if (
      this.hasCustomActivationCriteria &&
      this.shouldActivateUnderCustomCriteria(
        { deltaX: inputData.deltaX, deltaY: inputData.deltaY, velocity },
        props
      )
    ) {
      if (
        this.shouldMultiFingerPanFail({
          pointerLength: inputData.maxPointers,
          scale: inputData.scale,
          deltaRotation: inputData.deltaRotation,
        })
      ) {
        return {
          failed: true,
        };
      }
      return { success: true };
    }
    return { success: false };
  }
}

export default PanGestureHandler;
