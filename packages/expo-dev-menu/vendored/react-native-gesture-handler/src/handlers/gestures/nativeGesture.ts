import { BaseGestureConfig, BaseGesture } from './gesture';
import {
  NativeViewGestureConfig,
  NativeViewGestureHandlerPayload,
} from '../NativeViewGestureHandler';

export class NativeGesture extends BaseGesture<NativeViewGestureHandlerPayload> {
  public config: BaseGestureConfig & NativeViewGestureConfig = {};

  constructor() {
    super();

    this.handlerName = 'NativeViewGestureHandler';
  }

  shouldActivateOnStart(value: boolean) {
    this.config.shouldActivateOnStart = value;
    return this;
  }

  disallowInterruption(value: boolean) {
    this.config.disallowInterruption = value;
    return this;
  }
}

export type NativeGestureType = InstanceType<typeof NativeGesture>;
