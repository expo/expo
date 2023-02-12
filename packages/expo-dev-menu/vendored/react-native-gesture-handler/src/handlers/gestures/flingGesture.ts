import { BaseGesture, BaseGestureConfig } from './gesture';
import {
  FlingGestureConfig,
  FlingGestureHandlerEventPayload,
} from '../FlingGestureHandler';

export class FlingGesture extends BaseGesture<FlingGestureHandlerEventPayload> {
  public config: BaseGestureConfig & FlingGestureConfig = {};

  constructor() {
    super();

    this.handlerName = 'FlingGestureHandler';
  }

  numberOfPointers(pointers: number) {
    this.config.numberOfPointers = pointers;
    return this;
  }

  direction(direction: number) {
    this.config.direction = direction;
    return this;
  }
}

export type FlingGestureType = InstanceType<typeof FlingGesture>;
