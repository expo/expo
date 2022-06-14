import { BaseGestureConfig, ContinousBaseGesture } from './gesture';
import { GestureUpdateEvent } from '../gestureHandlerCommon';
import {
  PanGestureConfig,
  PanGestureHandlerEventPayload,
} from '../PanGestureHandler';

type PanGestureChangeEventPayload = {
  changeX: number;
  changeY: number;
};

function changeEventCalculator(
  current: GestureUpdateEvent<PanGestureHandlerEventPayload>,
  previous?: GestureUpdateEvent<PanGestureHandlerEventPayload>
) {
  'worklet';
  let changePayload: PanGestureChangeEventPayload;
  if (previous === undefined) {
    changePayload = {
      changeX: current.translationX,
      changeY: current.translationY,
    };
  } else {
    changePayload = {
      changeX: current.translationX - previous.translationX,
      changeY: current.translationY - previous.translationY,
    };
  }

  return { ...current, ...changePayload };
}

export class PanGesture extends ContinousBaseGesture<
  PanGestureHandlerEventPayload,
  PanGestureChangeEventPayload
> {
  public config: BaseGestureConfig & PanGestureConfig = {};

  constructor() {
    super();

    this.handlerName = 'PanGestureHandler';
  }

  activeOffsetY(offset: number | number[]) {
    if (Array.isArray(offset)) {
      this.config.activeOffsetYStart = offset[0];
      this.config.activeOffsetYEnd = offset[1];
    } else if (offset < 0) {
      this.config.activeOffsetYStart = offset;
    } else {
      this.config.activeOffsetYEnd = offset;
    }
    return this;
  }

  activeOffsetX(offset: number | number[]) {
    if (Array.isArray(offset)) {
      this.config.activeOffsetXStart = offset[0];
      this.config.activeOffsetXEnd = offset[1];
    } else if (offset < 0) {
      this.config.activeOffsetXStart = offset;
    } else {
      this.config.activeOffsetXEnd = offset;
    }
    return this;
  }

  failOffsetY(offset: number | number[]) {
    if (Array.isArray(offset)) {
      this.config.failOffsetYStart = offset[0];
      this.config.failOffsetYEnd = offset[1];
    } else if (offset < 0) {
      this.config.failOffsetYStart = offset;
    } else {
      this.config.failOffsetYEnd = offset;
    }
    return this;
  }

  failOffsetX(offset: number | number[]) {
    if (Array.isArray(offset)) {
      this.config.failOffsetXStart = offset[0];
      this.config.failOffsetXEnd = offset[1];
    } else if (offset < 0) {
      this.config.failOffsetXStart = offset;
    } else {
      this.config.failOffsetXEnd = offset;
    }
    return this;
  }

  minPointers(minPointers: number) {
    this.config.minPointers = minPointers;
    return this;
  }

  maxPointers(maxPointers: number) {
    this.config.maxPointers = maxPointers;
    return this;
  }

  minDistance(distance: number) {
    this.config.minDist = distance;
    return this;
  }

  minVelocity(velocity: number) {
    this.config.minVelocity = velocity;
    return this;
  }

  minVelocityX(velocity: number) {
    this.config.minVelocityX = velocity;
    return this;
  }

  minVelocityY(velocity: number) {
    this.config.minVelocityY = velocity;
    return this;
  }

  averageTouches(value: boolean) {
    this.config.avgTouches = value;
    return this;
  }

  enableTrackpadTwoFingerGesture(value: boolean) {
    this.config.enableTrackpadTwoFingerGesture = value;
    return this;
  }

  onChange(
    callback: (
      event: GestureUpdateEvent<
        PanGestureHandlerEventPayload & PanGestureChangeEventPayload
      >
    ) => void
  ) {
    // @ts-ignore TS being overprotective, PanGestureHandlerEventPayload is Record
    this.handlers.changeEventCalculator = changeEventCalculator;
    return super.onChange(callback);
  }
}

export type PanGestureType = InstanceType<typeof PanGesture>;
