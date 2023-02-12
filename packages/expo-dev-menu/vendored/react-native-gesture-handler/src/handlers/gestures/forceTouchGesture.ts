import { BaseGestureConfig, ContinousBaseGesture } from './gesture';
import {
  ForceTouchGestureConfig,
  ForceTouchGestureHandlerEventPayload,
} from '../ForceTouchGestureHandler';
import { GestureUpdateEvent } from '../gestureHandlerCommon';

type ForceTouchGestureChangeEventPayload = {
  forceChange: number;
};

function changeEventCalculator(
  current: GestureUpdateEvent<ForceTouchGestureHandlerEventPayload>,
  previous?: GestureUpdateEvent<ForceTouchGestureHandlerEventPayload>
) {
  'worklet';
  let changePayload: ForceTouchGestureChangeEventPayload;
  if (previous === undefined) {
    changePayload = {
      forceChange: current.force,
    };
  } else {
    changePayload = {
      forceChange: current.force - previous.force,
    };
  }

  return { ...current, ...changePayload };
}

export class ForceTouchGesture extends ContinousBaseGesture<
  ForceTouchGestureHandlerEventPayload,
  ForceTouchGestureChangeEventPayload
> {
  public config: BaseGestureConfig & ForceTouchGestureConfig = {};

  constructor() {
    super();

    this.handlerName = 'ForceTouchGestureHandler';
  }

  minForce(force: number) {
    this.config.minForce = force;
    return this;
  }

  maxForce(force: number) {
    this.config.maxForce = force;
    return this;
  }

  feedbackOnActivation(value: boolean) {
    this.config.feedbackOnActivation = value;
    return this;
  }

  onChange(
    callback: (
      event: GestureUpdateEvent<
        GestureUpdateEvent<
          ForceTouchGestureHandlerEventPayload &
            ForceTouchGestureChangeEventPayload
        >
      >
    ) => void
  ) {
    // @ts-ignore TS being overprotective, ForceTouchGestureHandlerEventPayload is Record
    this.handlers.changeEventCalculator = changeEventCalculator;
    return super.onChange(callback);
  }
}

export type ForceTouchGestureType = InstanceType<typeof ForceTouchGesture>;
