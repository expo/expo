import { ContinousBaseGesture } from './gesture';
import { PinchGestureHandlerEventPayload } from '../PinchGestureHandler';
import { GestureUpdateEvent } from '../gestureHandlerCommon';

type PinchGestureChangeEventPayload = {
  scaleChange: number;
};

function changeEventCalculator(
  current: GestureUpdateEvent<PinchGestureHandlerEventPayload>,
  previous?: GestureUpdateEvent<PinchGestureHandlerEventPayload>
) {
  'worklet';
  let changePayload: PinchGestureChangeEventPayload;
  if (previous === undefined) {
    changePayload = {
      scaleChange: current.scale,
    };
  } else {
    changePayload = {
      scaleChange: current.scale / previous.scale,
    };
  }

  return { ...current, ...changePayload };
}

export class PinchGesture extends ContinousBaseGesture<
  PinchGestureHandlerEventPayload,
  PinchGestureChangeEventPayload
> {
  constructor() {
    super();

    this.handlerName = 'PinchGestureHandler';
  }

  onChange(
    callback: (
      event: GestureUpdateEvent<
        PinchGestureHandlerEventPayload & PinchGestureChangeEventPayload
      >
    ) => void
  ) {
    // @ts-ignore TS being overprotective, PinchGestureHandlerEventPayload is Record
    this.handlers.changeEventCalculator = changeEventCalculator;
    return super.onChange(callback);
  }
}

export type PinchGestureType = InstanceType<typeof PinchGesture>;
