import { BaseGestureConfig, BaseGesture } from './gesture';
import {
  TapGestureConfig,
  TapGestureHandlerEventPayload,
} from '../TapGestureHandler';

export class TapGesture extends BaseGesture<TapGestureHandlerEventPayload> {
  public config: BaseGestureConfig & TapGestureConfig = {};

  constructor() {
    super();

    this.handlerName = 'TapGestureHandler';
  }

  minPointers(minPointers: number) {
    this.config.minPointers = minPointers;
    return this;
  }

  numberOfTaps(count: number) {
    this.config.numberOfTaps = count;
    return this;
  }

  maxDistance(maxDist: number) {
    this.config.maxDist = maxDist;
    return this;
  }

  maxDuration(duration: number) {
    this.config.maxDurationMs = duration;
    return this;
  }

  maxDelay(delay: number) {
    this.config.maxDelayMs = delay;
    return this;
  }

  maxDeltaX(delta: number) {
    this.config.maxDeltaX = delta;
    return this;
  }

  maxDeltaY(delta: number) {
    this.config.maxDeltaY = delta;
    return this;
  }
}

export type TapGestureType = InstanceType<typeof TapGesture>;
