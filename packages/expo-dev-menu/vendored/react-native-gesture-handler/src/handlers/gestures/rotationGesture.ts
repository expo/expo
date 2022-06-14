import { ContinousBaseGesture } from './gesture';
import { RotationGestureHandlerEventPayload } from '../RotationGestureHandler';
import { GestureUpdateEvent } from '../gestureHandlerCommon';

type RotationGestureChangeEventPayload = {
  rotationChange: number;
};

function changeEventCalculator(
  current: GestureUpdateEvent<RotationGestureHandlerEventPayload>,
  previous?: GestureUpdateEvent<RotationGestureHandlerEventPayload>
) {
  'worklet';
  let changePayload: RotationGestureChangeEventPayload;
  if (previous === undefined) {
    changePayload = {
      rotationChange: current.rotation,
    };
  } else {
    changePayload = {
      rotationChange: current.rotation - previous.rotation,
    };
  }

  return { ...current, ...changePayload };
}

export class RotationGesture extends ContinousBaseGesture<
  RotationGestureHandlerEventPayload,
  RotationGestureChangeEventPayload
> {
  constructor() {
    super();

    this.handlerName = 'RotationGestureHandler';
  }

  onChange(
    callback: (
      event: GestureUpdateEvent<
        RotationGestureHandlerEventPayload & RotationGestureChangeEventPayload
      >
    ) => void
  ) {
    // @ts-ignore TS being overprotective, RotationGestureHandlerEventPayload is Record
    this.handlers.changeEventCalculator = changeEventCalculator;
    return super.onChange(callback);
  }
}

export type RotationGestureType = InstanceType<typeof RotationGesture>;
