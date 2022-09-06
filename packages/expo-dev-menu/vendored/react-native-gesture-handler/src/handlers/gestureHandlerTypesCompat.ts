import {
  BaseButtonProps,
  BorderlessButtonProps,
  RawButtonProps,
  RectButtonProps,
} from '../components/GestureButtons';
import {
  GestureEvent,
  GestureEventPayload,
  HandlerStateChangeEvent,
  HandlerStateChangeEventPayload,
} from './gestureHandlerCommon';
import {
  FlingGestureHandlerEventPayload,
  FlingGestureHandlerProps,
} from './FlingGestureHandler';
import {
  ForceTouchGestureHandlerEventPayload,
  ForceTouchGestureHandlerProps,
} from './ForceTouchGestureHandler';
import {
  LongPressGestureHandlerEventPayload,
  LongPressGestureHandlerProps,
} from './LongPressGestureHandler';
import {
  PanGestureHandlerEventPayload,
  PanGestureHandlerProps,
} from './PanGestureHandler';
import {
  PinchGestureHandlerEventPayload,
  PinchGestureHandlerProps,
} from './PinchGestureHandler';
import {
  RotationGestureHandlerEventPayload,
  RotationGestureHandlerProps,
} from './RotationGestureHandler';
import {
  TapGestureHandlerEventPayload,
  TapGestureHandlerProps,
} from './TapGestureHandler';
import {
  NativeViewGestureHandlerPayload,
  NativeViewGestureHandlerProps,
} from './NativeViewGestureHandler';

// events
export type GestureHandlerGestureEventNativeEvent = GestureEventPayload;
export type GestureHandlerStateChangeNativeEvent = HandlerStateChangeEventPayload;
export type GestureHandlerGestureEvent = GestureEvent;
export type GestureHandlerStateChangeEvent = HandlerStateChangeEvent;
// gesture handlers events
export type NativeViewGestureHandlerGestureEvent = GestureEvent<NativeViewGestureHandlerPayload>;
export type NativeViewGestureHandlerStateChangeEvent = HandlerStateChangeEvent<NativeViewGestureHandlerPayload>;

export type TapGestureHandlerGestureEvent = GestureEvent<TapGestureHandlerEventPayload>;
export type TapGestureHandlerStateChangeEvent = HandlerStateChangeEvent<TapGestureHandlerEventPayload>;

export type ForceTouchGestureHandlerGestureEvent = GestureEvent<ForceTouchGestureHandlerEventPayload>;
export type ForceTouchGestureHandlerStateChangeEvent = HandlerStateChangeEvent<ForceTouchGestureHandlerEventPayload>;

export type LongPressGestureHandlerGestureEvent = GestureEvent<LongPressGestureHandlerEventPayload>;
export type LongPressGestureHandlerStateChangeEvent = HandlerStateChangeEvent<LongPressGestureHandlerEventPayload>;

export type PanGestureHandlerGestureEvent = GestureEvent<PanGestureHandlerEventPayload>;
export type PanGestureHandlerStateChangeEvent = HandlerStateChangeEvent<PanGestureHandlerEventPayload>;

export type PinchGestureHandlerGestureEvent = GestureEvent<PinchGestureHandlerEventPayload>;
export type PinchGestureHandlerStateChangeEvent = HandlerStateChangeEvent<PinchGestureHandlerEventPayload>;

export type RotationGestureHandlerGestureEvent = GestureEvent<RotationGestureHandlerEventPayload>;
export type RotationGestureHandlerStateChangeEvent = HandlerStateChangeEvent<RotationGestureHandlerEventPayload>;

export type FlingGestureHandlerGestureEvent = GestureEvent<FlingGestureHandlerEventPayload>;
export type FlingGestureHandlerStateChangeEvent = HandlerStateChangeEvent<FlingGestureHandlerEventPayload>;

// handlers properties
export type NativeViewGestureHandlerProperties = NativeViewGestureHandlerProps;
export type TapGestureHandlerProperties = TapGestureHandlerProps;
export type LongPressGestureHandlerProperties = LongPressGestureHandlerProps;
export type PanGestureHandlerProperties = PanGestureHandlerProps;
export type PinchGestureHandlerProperties = PinchGestureHandlerProps;
export type RotationGestureHandlerProperties = RotationGestureHandlerProps;
export type FlingGestureHandlerProperties = FlingGestureHandlerProps;
export type ForceTouchGestureHandlerProperties = ForceTouchGestureHandlerProps;
// button props
export type RawButtonProperties = RawButtonProps;
export type BaseButtonProperties = BaseButtonProps;
export type RectButtonProperties = RectButtonProps;
export type BorderlessButtonProperties = BorderlessButtonProps;
