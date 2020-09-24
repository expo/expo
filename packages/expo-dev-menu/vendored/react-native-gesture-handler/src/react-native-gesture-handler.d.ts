// Project: https://github.com/software-mansion/react-native-gesture-handler
// TypeScript Version: 2.6.2

declare module 'react-native-gesture-handler' {
  import * as React from 'react';
  import {
    Animated,
    FlatListProperties,
    ScrollViewProperties,
    SwitchProperties,
    TextInputProperties,
    DrawerLayoutAndroidProperties,
    TouchableHighlightProperties,
    TouchableOpacityProperties,
    TouchableNativeFeedbackProperties,
    TouchableWithoutFeedbackProperties,
    Insets,
    ViewStyle,
    StyleProp,
    ViewProps,
  } from 'react-native';

  /* GESTURE HANDLER STATE */

  export enum Directions {
    RIGHT = 1,
    LEFT = 2,
    UP = 4,
    DOWN = 8,
  }

  export enum State {
    UNDETERMINED = 0,
    FAILED,
    BEGAN,
    CANCELLED,
    ACTIVE,
    END,
  }

  /* STATE CHANGE EVENTS */

  export interface GestureHandlerGestureEventNativeEvent {
    handlerTag: number;
    numberOfPointers: number;
    state: State;
  }

  export interface GestureHandlerStateChangeNativeEvent {
    handlerTag: number;
    numberOfPointers: number;
    state: State;
    oldState: State;
  }

  export interface GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent;
  }

  export interface GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent;
  }

  interface NativeViewGestureHandlerEventExtra {
    pointerInside: boolean;
  }

  export interface NativeViewGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      NativeViewGestureHandlerEventExtra;
  }

  export interface NativeViewGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      NativeViewGestureHandlerEventExtra;
  }

  interface TapGestureHandlerEventExtra {
    x: number;
    y: number;
    absoluteX: number;
    absoluteY: number;
  }

  interface ForceTouchGestureHandlerEventExtra {
    x: number;
    y: number;
    absoluteX: number;
    absoluteY: number;
    force: number;
  }

  export interface TapGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      TapGestureHandlerEventExtra;
  }

  export interface TapGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      TapGestureHandlerEventExtra;
  }

  export interface ForceTouchGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      ForceTouchGestureHandlerEventExtra;
  }

  export interface LongPressGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      LongPressGestureHandlerEventExtra;
  }

  export interface ForceTouchGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      ForceTouchGestureHandlerEventExtra;
  }

  interface LongPressGestureHandlerEventExtra {
    x: number;
    y: number;
    absoluteX: number;
    absoluteY: number;
  }

  export interface LongPressGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      LongPressGestureHandlerEventExtra;
  }

  interface PanGestureHandlerEventExtra {
    x: number;
    y: number;
    absoluteX: number;
    absoluteY: number;
    translationX: number;
    translationY: number;
    velocityX: number;
    velocityY: number;
  }

  export interface PanGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      PanGestureHandlerEventExtra;
  }

  export interface PanGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      PanGestureHandlerEventExtra;
  }

  interface PinchGestureHandlerEventExtra {
    scale: number;
    focalX: number;
    focalY: number;
    velocity: number;
  }

  export interface PinchGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      PinchGestureHandlerEventExtra;
  }

  export interface PinchGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      PinchGestureHandlerEventExtra;
  }

  interface RotationGestureHandlerEventExtra {
    rotation: number;
    anchorX: number;
    anchorY: number;
    velocity: number;
  }

  export interface RotationGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      RotationGestureHandlerEventExtra;
  }

  export interface RotationGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent &
      RotationGestureHandlerEventExtra;
  }

  export interface FlingGestureHandlerStateChangeEvent
    extends GestureHandlerStateChangeEvent {
    nativeEvent: GestureHandlerStateChangeNativeEvent &
      FlingGestureHandlerEventExtra;
  }

  export interface FlingGestureHandlerGestureEvent
    extends GestureHandlerGestureEvent {
    nativeEvent: GestureHandlerGestureEventNativeEvent;
  }

  interface FlingGestureHandlerEventExtra {
    x: number;
    y: number;
    absoluteX: number;
    absoluteY: number;
  }

  /* GESTURE HANDLERS PROPERTIES */

  export interface GestureHandlerProperties {
    id?: string;
    enabled?: boolean;
    waitFor?: React.Ref<any> | React.Ref<any>[];
    simultaneousHandlers?: React.Ref<any> | React.Ref<any>[];
    shouldCancelWhenOutside?: boolean;
    hitSlop?:
      | number
      | {
          left?: number;
          right?: number;
          top?: number;
          bottom?: number;
          vertical?: number;
          horizontal?: number;
        }
      | {
          width: number;
          left: number;
        }
      | {
          width: number;
          right: number;
        }
      | {
          height: number;
          top: number;
        }
      | {
          height: number;
          bottom: number;
        };
  }

  export interface NativeViewGestureHandlerProperties
    extends GestureHandlerProperties {
    shouldActivateOnStart?: boolean;
    disallowInterruption?: boolean;
    onGestureEvent?: (event: NativeViewGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (
      event: NativeViewGestureHandlerStateChangeEvent
    ) => void;
  }

  export interface TapGestureHandlerProperties extends GestureHandlerProperties {
    minPointers?: number;
    maxDurationMs?: number;
    maxDelayMs?: number;
    numberOfTaps?: number;
    maxDeltaX?: number;
    maxDeltaY?: number;
    maxDist?: number;
    onGestureEvent?: (event: TapGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (event: TapGestureHandlerStateChangeEvent) => void;
  }

  export interface ForceTouchGestureHandlerProperties extends GestureHandlerProperties {
    minForce?: number,
    maxForce?: number,
    feedbackOnActivation?: boolean,
    onGestureEvent?: (event: ForceTouchGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (event: ForceTouchGestureHandlerStateChangeEvent) => void;
  }

  export interface LongPressGestureHandlerProperties
    extends GestureHandlerProperties {
    minDurationMs?: number;
    maxDist?: number;
    onGestureEvent?: (event: LongPressGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (event: LongPressGestureHandlerStateChangeEvent) => void;
  }

  export interface PanGestureHandlerProperties extends GestureHandlerProperties {
    /** @deprecated  use activeOffsetX*/
    minDeltaX?: number;
    /** @deprecated  use activeOffsetY*/
    minDeltaY?: number;
    /** @deprecated  use failOffsetX*/
    maxDeltaX?: number;
    /** @deprecated  use failOffsetY*/
    maxDeltaY?: number;
    /** @deprecated  use activeOffsetX*/
    minOffsetX?: number;
    /** @deprecated  use failOffsetY*/
    minOffsetY?: number;
    activeOffsetY?: number | number[];
    activeOffsetX?: number | number[];
    failOffsetY?: number | number[];
    failOffsetX?: number | number[];
    minDist?: number;
    minVelocity?: number;
    minVelocityX?: number;
    minVelocityY?: number;
    minPointers?: number;
    maxPointers?: number;
    avgTouches?: boolean;
    onGestureEvent?: (event: PanGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (event: PanGestureHandlerStateChangeEvent) => void;
  }

  export interface PinchGestureHandlerProperties
    extends GestureHandlerProperties {
    onGestureEvent?: (event: PinchGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (event: PinchGestureHandlerStateChangeEvent) => void;
  }

  export interface RotationGestureHandlerProperties
    extends GestureHandlerProperties {
    onGestureEvent?: (event: RotationGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (
      event: RotationGestureHandlerStateChangeEvent
    ) => void;
  }

  export interface FlingGestureHandlerProperties
    extends GestureHandlerProperties {
    direction?: number;
    numberOfPointers?: number;
    onGestureEvent?: (event: FlingGestureHandlerGestureEvent) => void;
    onHandlerStateChange?: (event: FlingGestureHandlerStateChangeEvent) => void;
  }

  /* GESTURE HANDLERS CLASSES */

  export class NativeViewGestureHandler extends React.Component<
    NativeViewGestureHandlerProperties
  > {}

  export class TapGestureHandler extends React.Component<
    TapGestureHandlerProperties
  > {}

  export class LongPressGestureHandler extends React.Component<
    LongPressGestureHandlerProperties
  > {}

  export class PanGestureHandler extends React.Component<
    PanGestureHandlerProperties
  > {}

  export class PinchGestureHandler extends React.Component<
    PinchGestureHandlerProperties
  > {}

  export class RotationGestureHandler extends React.Component<
    RotationGestureHandlerProperties
  > {}

  export class FlingGestureHandler extends React.Component<
    FlingGestureHandlerProperties
  > {}

  export class ForceTouchGestureHandler extends React.Component<
    ForceTouchGestureHandlerProperties
  > {}

  /* BUTTONS PROPERTIES */

  export interface RawButtonProperties
    extends NativeViewGestureHandlerProperties {
    exclusive?: boolean;
    testID?: string;
    accessibilityLabel?: string;
  }

  export interface BaseButtonProperties extends RawButtonProperties {
    onPress?: (pointerInside: boolean) => void;
    onActiveStateChange?: (active: boolean) => void;
    style?: StyleProp<ViewStyle>;
    rippleColor?: string;
  }

  export interface RectButtonProperties extends BaseButtonProperties {
    underlayColor?: string;
    activeOpacity?: number;
  }

  export interface BorderlessButtonProperties extends BaseButtonProperties {
    borderless?: boolean;
    activeOpacity?: number;
  }

  /* BUTTONS CLASSES */

  export class RawButton extends React.Component<RawButtonProperties> {}

  export class BaseButton extends React.Component<BaseButtonProperties> {}

  export class RectButton extends React.Component<RectButtonProperties> {}

  export class BorderlessButton extends React.Component<
    BorderlessButtonProperties
  > {}

  export interface ContainedTouchableProperties {
    containerStyle?: StyleProp<ViewStyle>
  }

  export class TouchableHighlight extends React.Component<
    TouchableHighlightProperties | ContainedTouchableProperties
    > {}

  export class TouchableNativeFeedback extends React.Component<
    TouchableNativeFeedbackProperties | ContainedTouchableProperties
    > {}

  export class TouchableOpacity extends React.Component<
    TouchableOpacityProperties | ContainedTouchableProperties
    > {}

  export class TouchableWithoutFeedback extends React.Component<
    TouchableWithoutFeedbackProperties | ContainedTouchableProperties
    > {}

  /* GESTURE HANDLER WRAPPED CLASSES */

  export class ScrollView extends React.Component<
    NativeViewGestureHandlerProperties & ScrollViewProperties
  > {
    scrollTo(y?: number | { x?: number; y?: number; animated?: boolean }, x?: number, animated?: boolean): void;
    scrollToEnd(options?: { animated: boolean }): void;
  }

  export class Switch extends React.Component<
    NativeViewGestureHandlerProperties & SwitchProperties
  > {}

  export class TextInput extends React.Component<
    NativeViewGestureHandlerProperties & TextInputProperties
  > {}

  export class DrawerLayoutAndroid extends React.Component<
    NativeViewGestureHandlerProperties & DrawerLayoutAndroidProperties
  > {}

  /* OTHER */

  export class FlatList<ItemT> extends React.Component<
    NativeViewGestureHandlerProperties & FlatListProperties<ItemT>
  > {
    scrollToEnd: (params?: { animated?: boolean }) => void;
    scrollToIndex: (params: { animated?: boolean; index: number; viewOffset?: number; viewPosition?: number }) => void;
    scrollToItem: (params: { animated?: boolean; item: ItemT; viewPosition?: number }) => void;
    scrollToOffset: (params: { animated?: boolean; offset: number }) => void;
  }

  export const GestureHandlerRootView: React.ComponentType<ViewProps>;

  export function gestureHandlerRootHOC<P = {}>(
    Component: React.ComponentType<P>,
    containerStyles?: StyleProp<ViewStyle>
  ): React.ComponentType<P>;

  export function createNativeWrapper<P = {}>(
    Component: React.ComponentType<P>,
    config: NativeViewGestureHandlerProperties
  ): React.ComponentType<P>;
}

declare module 'react-native-gesture-handler/Swipeable' {
  import { Animated, StyleProp, ViewStyle } from 'react-native';
  import { PanGestureHandlerProperties } from 'react-native-gesture-handler'
  type SwipeableExcludes = Exclude<keyof PanGestureHandlerProperties, 'onGestureEvent' | 'onHandlerStateChange'>

  interface SwipeableProperties extends Pick<PanGestureHandlerProperties, SwipeableExcludes> {
    friction?: number;
    leftThreshold?: number;
    rightThreshold?: number;
    overshootLeft?: boolean;
    overshootRight?: boolean;
    overshootFriction?: number,
    onSwipeableLeftOpen?: () => void;
    onSwipeableRightOpen?: () => void;
    onSwipeableOpen?: () => void;
    onSwipeableClose?: () => void;
    onSwipeableLeftWillOpen?: () => void;
    onSwipeableRightWillOpen?: () => void;
    onSwipeableWillOpen?: () => void;
    onSwipeableWillClose?: () => void;
    /**
     *
     * This map describes the values to use as inputRange for extra interpolation:
     * AnimatedValue: [startValue, endValue]
     *
     * progressAnimatedValue: [0, 1]
     * dragAnimatedValue: [0, +]
     *
     * To support `rtl` flexbox layouts use `flexDirection` styling.
     * */
    renderLeftActions?: (
      progressAnimatedValue: Animated.AnimatedInterpolation,
      dragAnimatedValue: Animated.AnimatedInterpolation
    ) => React.ReactNode;
    /**
     *
     * This map describes the values to use as inputRange for extra interpolation:
     * AnimatedValue: [startValue, endValue]
     *
     * progressAnimatedValue: [0, 1]
     * dragAnimatedValue: [0, -]
     *
     * To support `rtl` flexbox layouts use `flexDirection` styling.
     * */
    renderRightActions?: (
      progressAnimatedValue: Animated.AnimatedInterpolation,
      dragAnimatedValue: Animated.AnimatedInterpolation
    ) => React.ReactNode;
    useNativeAnimations?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    childrenContainerStyle?: StyleProp<ViewStyle>;
  }

  export default class Swipeable extends React.Component<SwipeableProperties> {
    close: () => void;
    openLeft: () => void;
    openRight: () => void;
  }
}

declare module 'react-native-gesture-handler/DrawerLayout' {
  import { Animated, StatusBarAnimation, StyleProp, ViewStyle } from 'react-native';

  export type DrawerPosition = 'left' | 'right';

  export type DrawerState = 'Idle' | 'Dragging' | 'Settling';

  export type DrawerType = 'front' | 'back' | 'slide';

  export type DrawerLockMode = 'unlocked' | 'locked-closed' | 'locked-open';

  export type DrawerKeyboardDismissMode = 'none' | 'on-drag';

  export interface DrawerLayoutProperties {
    renderNavigationView: (
      progressAnimatedValue: Animated.Value
    ) => React.ReactNode;
    drawerPosition?: DrawerPosition;
    drawerWidth?: number;
    drawerBackgroundColor?: string;
    drawerLockMode?: DrawerLockMode;
    keyboardDismissMode?: DrawerKeyboardDismissMode;
    onDrawerClose?: () => void;
    onDrawerOpen?: () => void;
    onDrawerStateChanged?: (
      newState: DrawerState,
      drawerWillShow: boolean
    ) => void;
    useNativeAnimations?: boolean;

    drawerType?: DrawerType;
    edgeWidth?: number;
    minSwipeDistance?: number;
    hideStatusBar?: boolean;
    statusBarAnimation?: StatusBarAnimation;
    overlayColor?: string;
    contentContainerStyle?: StyleProp<ViewStyle>;
  }

  interface DrawerMovementOptionType {
    velocity?: number;
  }

  export default class DrawerLayout extends React.Component<DrawerLayoutProperties> {
    openDrawer: (options?: DrawerMovementOptionType) => void;
    closeDrawer: (options?: DrawerMovementOptionType) => void;
  }
}
