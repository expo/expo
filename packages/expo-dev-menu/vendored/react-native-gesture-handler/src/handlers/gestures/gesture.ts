import { FlingGestureHandlerEventPayload } from '../FlingGestureHandler';
import { ForceTouchGestureHandlerEventPayload } from '../ForceTouchGestureHandler';
import {
  HitSlop,
  CommonGestureConfig,
  GestureTouchEvent,
  GestureStateChangeEvent,
  GestureUpdateEvent,
} from '../gestureHandlerCommon';
import { getNextHandlerTag } from '../handlersRegistry';
import { GestureStateManagerType } from './gestureStateManager';
import { LongPressGestureHandlerEventPayload } from '../LongPressGestureHandler';
import { PanGestureHandlerEventPayload } from '../PanGestureHandler';
import { PinchGestureHandlerEventPayload } from '../PinchGestureHandler';
import { RotationGestureHandlerEventPayload } from '../RotationGestureHandler';
import { TapGestureHandlerEventPayload } from '../TapGestureHandler';
import { NativeViewGestureHandlerPayload } from '../NativeViewGestureHandler';

export type GestureType =
  | BaseGesture<Record<string, unknown>>
  | BaseGesture<Record<string, never>>
  | BaseGesture<TapGestureHandlerEventPayload>
  | BaseGesture<PanGestureHandlerEventPayload>
  | BaseGesture<LongPressGestureHandlerEventPayload>
  | BaseGesture<RotationGestureHandlerEventPayload>
  | BaseGesture<PinchGestureHandlerEventPayload>
  | BaseGesture<FlingGestureHandlerEventPayload>
  | BaseGesture<ForceTouchGestureHandlerEventPayload>
  | BaseGesture<NativeViewGestureHandlerPayload>;

export type GestureRef =
  | number
  | GestureType
  | React.RefObject<GestureType | undefined>
  | React.RefObject<React.ComponentType | undefined>; // allow adding a ref to a gesture handler
export interface BaseGestureConfig
  extends CommonGestureConfig,
    Record<string, unknown> {
  ref?: React.MutableRefObject<GestureType | undefined>;
  requireToFail?: GestureRef[];
  simultaneousWith?: GestureRef[];
  needsPointerData?: boolean;
  manualActivation?: boolean;
}

type TouchEventHandlerType = (
  event: GestureTouchEvent,
  stateManager: GestureStateManagerType
) => void;

export type HandlerCallbacks<EventPayloadT extends Record<string, unknown>> = {
  handlerTag: number;
  onBegin?: (event: GestureStateChangeEvent<EventPayloadT>) => void;
  onStart?: (event: GestureStateChangeEvent<EventPayloadT>) => void;
  onEnd?: (
    event: GestureStateChangeEvent<EventPayloadT>,
    success: boolean
  ) => void;
  onFinalize?: (
    event: GestureStateChangeEvent<EventPayloadT>,
    success: boolean
  ) => void;
  onUpdate?: (event: GestureUpdateEvent<EventPayloadT>) => void;
  onChange?: (event: any) => void;
  onTouchesDown?: TouchEventHandlerType;
  onTouchesMove?: TouchEventHandlerType;
  onTouchesUp?: TouchEventHandlerType;
  onTouchesCancelled?: TouchEventHandlerType;
  changeEventCalculator?: (
    current: GestureUpdateEvent<Record<string, unknown>>,
    previous?: GestureUpdateEvent<Record<string, unknown>>
  ) => GestureUpdateEvent<Record<string, unknown>>;
  isWorklet: boolean[];
};

export const CALLBACK_TYPE = {
  UNDEFINED: 0,
  BEGAN: 1,
  START: 2,
  UPDATE: 3,
  CHANGE: 4,
  END: 5,
  FINALIZE: 6,
  TOUCHES_DOWN: 7,
  TOUCHES_MOVE: 8,
  TOUCHES_UP: 9,
  TOUCHES_CANCELLED: 10,
} as const;

// Allow using CALLBACK_TYPE as object and type
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type CALLBACK_TYPE = typeof CALLBACK_TYPE[keyof typeof CALLBACK_TYPE];

export abstract class Gesture {
  /**
   * Return array of gestures, providing the same interface for creating and updating
   * handlers, no matter which object was used to create gesture instance.
   */
  abstract toGestureArray(): GestureType[];

  /**
   * Assign handlerTag to the gesture instance and set ref.current (if a ref is set)
   */
  abstract initialize(): void;

  /**
   * Make sure that values of properties defining relations are arrays. Do any necessary
   * preprocessing required to configure relations between handlers. Called just before
   * updating the handler on the native side.
   */
  abstract prepare(): void;
}

export abstract class BaseGesture<
  EventPayloadT extends Record<string, unknown>
> extends Gesture {
  public handlerTag = -1;
  public handlerName = '';
  public config: BaseGestureConfig = {};
  public handlers: HandlerCallbacks<EventPayloadT> = {
    handlerTag: -1,
    isWorklet: [false, false, false, false],
  };

  private addDependency(
    key: 'simultaneousWith' | 'requireToFail',
    gesture: Exclude<GestureRef, number>
  ) {
    const value = this.config[key];
    this.config[key] = value
      ? Array<GestureRef>().concat(value, gesture)
      : [gesture];
  }

  withRef(ref: React.MutableRefObject<GestureType | undefined>) {
    this.config.ref = ref;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected isWorklet(callback: Function) {
    //@ts-ignore if callback is a worklet, the property will be available, if not then the check will return false
    return callback.__workletHash !== undefined;
  }

  onBegin(callback: (event: GestureStateChangeEvent<EventPayloadT>) => void) {
    this.handlers.onBegin = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.BEGAN] = this.isWorklet(callback);
    return this;
  }

  onStart(callback: (event: GestureStateChangeEvent<EventPayloadT>) => void) {
    this.handlers.onStart = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.START] = this.isWorklet(callback);
    return this;
  }

  onEnd(
    callback: (
      event: GestureStateChangeEvent<EventPayloadT>,
      success: boolean
    ) => void
  ) {
    this.handlers.onEnd = callback;
    //@ts-ignore if callback is a worklet, the property will be available, if not then the check will return false
    this.handlers.isWorklet[CALLBACK_TYPE.END] = this.isWorklet(callback);
    return this;
  }

  onFinalize(
    callback: (
      event: GestureStateChangeEvent<EventPayloadT>,
      success: boolean
    ) => void
  ) {
    this.handlers.onFinalize = callback;
    //@ts-ignore if callback is a worklet, the property will be available, if not then the check will return false
    this.handlers.isWorklet[CALLBACK_TYPE.FINALIZE] = this.isWorklet(callback);
    return this;
  }

  onTouchesDown(callback: TouchEventHandlerType) {
    this.config.needsPointerData = true;
    this.handlers.onTouchesDown = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.TOUCHES_DOWN] = this.isWorklet(
      callback
    );

    return this;
  }

  onTouchesMove(callback: TouchEventHandlerType) {
    this.config.needsPointerData = true;
    this.handlers.onTouchesMove = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.TOUCHES_MOVE] = this.isWorklet(
      callback
    );

    return this;
  }

  onTouchesUp(callback: TouchEventHandlerType) {
    this.config.needsPointerData = true;
    this.handlers.onTouchesUp = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.TOUCHES_UP] = this.isWorklet(
      callback
    );

    return this;
  }

  onTouchesCancelled(callback: TouchEventHandlerType) {
    this.config.needsPointerData = true;
    this.handlers.onTouchesCancelled = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.TOUCHES_CANCELLED] = this.isWorklet(
      callback
    );

    return this;
  }

  enabled(enabled: boolean) {
    this.config.enabled = enabled;
    return this;
  }

  shouldCancelWhenOutside(value: boolean) {
    this.config.shouldCancelWhenOutside = value;
    return this;
  }

  hitSlop(hitSlop: HitSlop) {
    this.config.hitSlop = hitSlop;
    return this;
  }

  simultaneousWithExternalGesture(...gestures: Exclude<GestureRef, number>[]) {
    for (const gesture of gestures) {
      this.addDependency('simultaneousWith', gesture);
    }
    return this;
  }

  requireExternalGestureToFail(...gestures: Exclude<GestureRef, number>[]) {
    for (const gesture of gestures) {
      this.addDependency('requireToFail', gesture);
    }
    return this;
  }

  initialize() {
    this.handlerTag = getNextHandlerTag();
    this.handlers = { ...this.handlers, handlerTag: this.handlerTag };

    if (this.config.ref) {
      this.config.ref.current = this as GestureType;
    }
  }

  toGestureArray(): GestureType[] {
    return [this as GestureType];
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prepare() {}
}

export abstract class ContinousBaseGesture<
  EventPayloadT extends Record<string, unknown>,
  EventChangePayloadT extends Record<string, unknown>
> extends BaseGesture<EventPayloadT> {
  onUpdate(callback: (event: GestureUpdateEvent<EventPayloadT>) => void) {
    this.handlers.onUpdate = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.UPDATE] = this.isWorklet(callback);
    return this;
  }

  onChange(
    callback: (
      event: GestureUpdateEvent<EventPayloadT & EventChangePayloadT>
    ) => void
  ) {
    this.handlers.onChange = callback;
    this.handlers.isWorklet[CALLBACK_TYPE.CHANGE] = this.isWorklet(callback);
    return this;
  }

  manualActivation(manualActivation: boolean) {
    this.config.manualActivation = manualActivation;
    return this;
  }
}
