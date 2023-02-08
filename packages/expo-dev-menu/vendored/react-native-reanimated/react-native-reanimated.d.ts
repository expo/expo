// Project: https://github.com/software-mansion/react-native-reanimated
// TypeScript Version: 2.8

declare module 'react-native-reanimated' {
  import {
    ComponentClass,
    ReactNode,
    Component,
    RefObject,
    FunctionComponent,
  } from 'react';
  import {
    ViewProps,
    TextProps,
    ImageProps,
    ScrollViewProps,
    FlatListProps,
    StyleProp,
    RegisteredStyle,
    ViewStyle,
    TextStyle,
    ImageStyle,
    TransformsStyle,
    View as ReactNativeView,
    Text as ReactNativeText,
    Image as ReactNativeImage,
    ScrollView as ReactNativeScrollView,
    FlatList as ReactNativeFlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ColorValue,
    EasingFunction,
  } from 'react-native';
  import {
    GestureHandlerGestureEvent,
    PanGestureHandlerGestureEvent,
  } from 'react-native-gesture-handler';

  import('./lib/reanimated2/globals');

  export type TimingAnimation =
    import('./lib/types/lib/reanimated2/animation/index').TimingAnimation;
  export type SpringAnimation =
    import('./lib/types/lib/reanimated2/animation/index').SpringAnimation;
  export type DecayAnimation =
    import('./lib/types/lib/reanimated2/animation/index').DecayAnimation;
  export type DelayAnimation =
    import('./lib/types/lib/reanimated2/animation/commonTypes').DelayAnimation;
  export type RepeatAnimation =
    import('./lib/types/lib/reanimated2/animation/index').RepeatAnimation;
  export type SequenceAnimation =
    import('./lib/types/lib/reanimated2/animation/index').SequenceAnimation;
  export type StyleLayoutAnimation =
    import('./lib/types/lib/reanimated2/animation/index').StyleLayoutAnimation;
  export type Animation<T> =
    import('./lib/types/lib/reanimated2/commonTypes').Animation<T>;
  export type MeasuredDimensions =
    import('./lib/types/lib/reanimated2/commonTypes').MeasuredDimensions;

  namespace Animated {
    type Nullable<T> = T | null | undefined;
    class AnimatedNode<T> {
      constructor(
        nodeConfig: object,
        inputNodes?: ReadonlyArray<AnimatedNode<any>>
      );

      isNativelyInitialized(): boolean;
      /**
       * ' __value' is not available at runtime on AnimatedNode<T>. It is
       * necessary to have some discriminating property on a type to know that
       * an AnimatedNode<number> and AnimatedNode<string> are not compatible types.
       */
      ' __value': T;
    }
    class AnimatedClock extends AnimatedNode<number> {
      constructor();
    }

    export enum Extrapolate {
      EXTEND = 'extend',
      CLAMP = 'clamp',
      IDENTITY = 'identity',
    }

    type ExtrapolateParameter =
      | Extrapolate
      | { extrapolateLeft?: Extrapolate; extrapolateRight?: Extrapolate };

    interface InterpolationConfig {
      inputRange: ReadonlyArray<Adaptable<number>>;
      outputRange: ReadonlyArray<Adaptable<number | string>>;
      extrapolate?: ExtrapolateParameter;
      extrapolateLeft?: Extrapolate;
      extrapolateRight?: Extrapolate;
    }
    type Value = string | number | boolean;
    class AnimatedValue<T extends Value> extends AnimatedNode<T> {
      constructor(value?: T);

      setValue(value: Adaptable<T>): void;

      interpolate(config: InterpolationConfig): AnimatedNode<number>;
    }
    export interface AnimationState {
      finished: AnimatedValue<number>;
      position: AnimatedValue<number>;
      time: AnimatedValue<number>;
    }

    export type SharedValue<T> = { value: T };
    export type DerivedValue<T> = Readonly<SharedValue<T>>;
    export type Mapping = { [key: string]: Mapping } | Adaptable<any>;
    export type Adaptable<T> =
      | T
      | AnimatedNode<T>
      | ReadonlyArray<T | AnimatedNode<T> | ReadonlyArray<T | AnimatedNode<T>>>;
    type BinaryOperator<T = number> = (
      left: Adaptable<number>,
      right: Adaptable<number>
    ) => AnimatedNode<T>;
    type UnaryOperator = (value: Adaptable<number>) => AnimatedNode<number>;
    type MultiOperator<T = number> = (
      a: Adaptable<number>,
      b: Adaptable<number>,
      ...others: Adaptable<number>[]
    ) => AnimatedNode<T>;

    export type TransformStyleTypes = TransformsStyle['transform'] extends
      | readonly (infer T)[]
      | undefined
      ? T
      : never;
    export type AdaptTransforms<T> = {
      [P in keyof T]: Adaptable<T[P]>;
    };
    export type AnimatedTransform = AdaptTransforms<TransformStyleTypes>[];

    export type AnimateStyle<S> = {
      [K in keyof S]: K extends 'transform'
        ? AnimatedTransform
        : S[K] extends ReadonlyArray<any>
        ? ReadonlyArray<AnimateStyle<S[K][0]>>
        : S[K] extends object
        ? AnimateStyle<S[K]>
        : S[K] extends ColorValue | undefined
        ? S[K] | number
        :
            | S[K]
            | AnimatedNode<
                // allow `number` where `string` normally is to support colors
                S[K] extends ColorValue | undefined ? S[K] | number : S[K]
              >;
    };

    export type StylesOrDefault<T> = 'style' extends keyof T
      ? T['style']
      : Record<string, unknown>;

    export type AnimateProps<P extends object> = {
      [K in keyof Omit<P, 'style'>]: P[K] | AnimatedNode<P[K]>;
    } & {
      style?: StyleProp<AnimateStyle<StylesOrDefault<P>>>;
    } & {
      animatedProps?: Partial<AnimateProps<P>>;
      layout?:
        | BaseAnimationBuilder
        | LayoutAnimationFunction
        | typeof BaseAnimationBuilder;
      entering?:
        | BaseAnimationBuilder
        | typeof BaseAnimationBuilder
        | EntryExitAnimationFunction
        | Keyframe;
      exiting?:
        | BaseAnimationBuilder
        | typeof BaseAnimationBuilder
        | EntryExitAnimationFunction
        | Keyframe;
    };

    export interface PhysicsAnimationState extends AnimationState {
      velocity: AnimatedValue<number>;
    }

    export type DecayState = PhysicsAnimationState;

    export interface DecayConfig {
      deceleration: Adaptable<number>;
    }
    export interface BackwardCompatibleWrapper {
      start: (callback?: (data: { finished: boolean }) => any) => void;
      stop: () => void;
    }

    export interface TimingState extends AnimationState {
      frameTime: AnimatedValue<number>;
    }
    export type EasingNodeFunction = (
      value: Adaptable<number>
    ) => AnimatedNode<number>;
    export type EasingFunction = (value: number) => number;
    export interface TimingConfig {
      toValue: Adaptable<number>;
      duration: Adaptable<number>;
      easing: EasingNodeFunction;
    }

    export type SpringState = PhysicsAnimationState;

    export interface SpringConfig {
      damping: Adaptable<number>;
      mass: Adaptable<number>;
      stiffness: Adaptable<number>;
      overshootClamping: Adaptable<number> | boolean;
      restSpeedThreshold: Adaptable<number>;
      restDisplacementThreshold: Adaptable<number>;
      toValue: Adaptable<number>;
    }
    interface SpringConfigWithOrigamiTensionAndFriction {
      tension: Adaptable<number>;
      mass: Adaptable<number>;
      friction: Adaptable<number>;
      overshootClamping: Adaptable<number> | boolean;
      restSpeedThreshold: Adaptable<number>;
      restDisplacementThreshold: Adaptable<number>;
      toValue: Adaptable<number>;
    }

    interface SpringConfigWithBouncinessAndSpeed {
      bounciness: Adaptable<number>;
      mass: Adaptable<number>;
      speed: Adaptable<number>;
      overshootClamping: Adaptable<number> | boolean;
      restSpeedThreshold: Adaptable<number>;
      restDisplacementThreshold: Adaptable<number>;
      toValue: Adaptable<number>;
    }

    type SpringUtils = {
      makeDefaultConfig: () => SpringConfig;
      makeConfigFromBouncinessAndSpeed: (
        prevConfig: SpringConfigWithBouncinessAndSpeed
      ) => SpringConfig;
      makeConfigFromOrigamiTensionAndFriction: (
        prevConfig: SpringConfigWithOrigamiTensionAndFriction
      ) => SpringConfig;
    };

    export const SpringUtils: SpringUtils;

    type CodeProps = {
      exec?: AnimatedNode<number>;
      children?: () => AnimatedNode<number>;
      dependencies?: Array<any>;
    };

    // components
    export class View extends Component<AnimateProps<ViewProps>> {
      getNode(): ReactNativeView;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface View extends ReactNativeView {}
    export class Text extends Component<AnimateProps<TextProps>> {
      getNode(): ReactNativeText;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Text extends ReactNativeText {}
    export class Image extends Component<AnimateProps<ImageProps>> {
      getNode(): ReactNativeImage;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Image extends ReactNativeImage {}
    export class ScrollView extends Component<AnimateProps<ScrollViewProps>> {
      getNode(): ReactNativeScrollView;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface ScrollView extends ReactNativeScrollView {}

    export class Code extends Component<CodeProps> {}
    export class FlatList<T> extends Component<AnimateProps<FlatListProps<T>>> {
      itemLayoutAnimation: ILayoutAnimationBuilder;
      getNode(): ReactNativeFlatList;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface FlatList<T> extends ReactNativeView<T> {}

    type Options<P> = {
      setNativeProps: (ref: any, props: P) => void;
    };
    export function createAnimatedComponent<P extends object>(
      component: ComponentClass<P>,
      options?: Options<P>
    ): ComponentClass<AnimateProps<P>>;
    export function createAnimatedComponent<P extends object>(
      component: FunctionComponent<P>,
      options?: Options<P>
    ): FunctionComponent<AnimateProps<P>>;

    // classes
    export {
      AnimatedClock as Clock,
      AnimatedNode as Node,
      AnimatedValue as Value,
    };

    // base operations
    export const add: MultiOperator;
    export const sub: MultiOperator;
    export const multiply: MultiOperator;
    export const divide: MultiOperator;
    export const pow: MultiOperator;
    export const modulo: MultiOperator;
    export const sqrt: UnaryOperator;
    export const log: UnaryOperator;
    export const sin: UnaryOperator;
    export const cos: UnaryOperator;
    export const tan: UnaryOperator;
    export const acos: UnaryOperator;
    export const asin: UnaryOperator;
    export const atan: UnaryOperator;
    export const exp: UnaryOperator;
    export const round: UnaryOperator;
    export const floor: UnaryOperator;
    export const ceil: UnaryOperator;
    export const lessThan: BinaryOperator<0 | 1>;
    export const eq: BinaryOperator<0 | 1>;
    export const greaterThan: BinaryOperator<0 | 1>;
    export const lessOrEq: BinaryOperator<0 | 1>;
    export const greaterOrEq: BinaryOperator<0 | 1>;
    export const neq: BinaryOperator<0 | 1>;
    export const and: MultiOperator<0 | 1>;
    export const or: MultiOperator<0 | 1>;
    export function proc<T extends (Adaptable<Value> | undefined)[]>(
      func: (...args: T) => AnimatedNode<number>
    ): typeof func;
    export function defined(value: Adaptable<any>): AnimatedNode<0 | 1>;
    export function not(value: Adaptable<any>): AnimatedNode<0 | 1>;
    export function set<T extends Value>(
      valueToBeUpdated: AnimatedValue<T>,
      sourceNode: Adaptable<T>
    ): AnimatedNode<T>;
    export function concat(
      ...args: Array<Adaptable<string> | Adaptable<number>>
    ): AnimatedNode<string>;
    export function cond<T1 extends Value = number, T2 extends Value = number>(
      conditionNode: Adaptable<number>,
      ifNode: Adaptable<T1>,
      elseNode?: Adaptable<T2>
    ): AnimatedNode<T1 | T2>;
    export function block<T1 extends Value = number, T2 extends Value = any>(
      items: ReadonlyArray<Adaptable<T2>>
    ): AnimatedNode<T1>;
    export function call<T>(
      args: ReadonlyArray<T | AnimatedNode<T>>,
      callback: (args: ReadonlyArray<T>) => void
    ): AnimatedNode<0>;
    export function debug<T>(
      message: string,
      value: AnimatedNode<T>
    ): AnimatedNode<T>;
    export function onChange(
      value: Adaptable<number>,
      action: Adaptable<number>
    ): AnimatedNode<number>;
    export function startClock(clock: AnimatedClock): AnimatedNode<0>;
    export function stopClock(clock: AnimatedClock): AnimatedNode<0>;
    export function clockRunning(clock: AnimatedClock): AnimatedNode<0 | 1>;
    // the return type for `event` is a lie, but it's the same lie that
    // react-native makes within Animated
    type EventArgFunc<T> = (arg: T) => AnimatedNode<number>;
    type EventMapping<T> = T extends object
      ? { [K in keyof T]?: EventMapping<T[K]> | EventArgFunc<T[K]> }
      : Adaptable<T> | EventArgFunc<T>;
    type EventMappingArray<T> = T extends Array<any>
      ? { [I in keyof T]: EventMapping<T[I]> }
      : [EventMapping<T>];
    export function event<T>(
      argMapping: T extends never
        ? ReadonlyArray<Mapping>
        : Readonly<EventMappingArray<T>>,
      config?: {}
    ): (...args: any[]) => void;

    // derived operations
    export function abs(value: Adaptable<number>): AnimatedNode<number>;
    export function acc(value: Adaptable<number>): AnimatedNode<number>;
    export function color(
      r: Adaptable<number>,
      g: Adaptable<number>,
      b: Adaptable<number>,
      a?: Adaptable<number>
    ): AnimatedNode<number | string>;
    export function diff(value: Adaptable<number>): AnimatedNode<number>;
    export function diffClamp(
      value: Adaptable<number>,
      minVal: Adaptable<number>,
      maxVal: Adaptable<number>
    ): AnimatedNode<number>;
    export function interpolateNode(
      value: Adaptable<number>,
      config: InterpolationConfig
    ): AnimatedNode<number>;
    export function interpolateColors<T extends string | number>(
      animationValue: Adaptable<number>,
      {
        inputRange,
        outputColorRange,
      }: {
        inputRange: ReadonlyArray<Adaptable<number>>;
        outputColorRange: ReadonlyArray<Adaptable<T>>;
      }
    ): AnimatedNode<T>;
    export const max: BinaryOperator;
    export const min: BinaryOperator;

    // animations
    export function decay(
      clock: AnimatedClock,
      state: DecayState,
      config: DecayConfig
    ): AnimatedNode<number>;
    export function timing(
      clock: AnimatedClock,
      state: TimingState,
      config: TimingConfig
    ): AnimatedNode<number>;
    export function spring(
      clock: AnimatedClock,
      state: SpringState,
      config: SpringConfig
    ): AnimatedNode<number>;
    // backward compatible API
    export function spring(
      node: AnimatedNode<number>,
      config: SpringConfig
    ): BackwardCompatibleWrapper;
    export function timing(
      node: AnimatedNode<number>,
      config: TimingConfig
    ): BackwardCompatibleWrapper;
    export function decay(
      node: AnimatedNode<number>,
      config: DecayConfig
    ): BackwardCompatibleWrapper;

    // hooks
    export function useCode(
      exec: () =>
        | Nullable<AnimatedNode<number>[] | AnimatedNode<number>>
        | boolean,
      deps: Array<any>
    ): void;
    export function useValue<T extends Value>(
      initialValue: T
    ): AnimatedValue<T>;

    // configuration
    export function addWhitelistedNativeProps(props: {
      [key: string]: true;
    }): void;
    export function addWhitelistedUIProps(props: { [key: string]: true }): void;
  }

  export default Animated;

  export type SharedValue<T> = Animated.SharedValue<T>;
  export type AnimateStyle<S> = Animated.AnimateStyle<S>;
  export type DerivedValue<T> = Animated.DerivedValue<T>;
  export type Mapping = Animated.Mapping;
  export type Adaptable<T> = Animated.Adaptable<T>;
  export type TransformStyleTypes = Animated.TransformStyleTypes;
  export type AdaptTransforms<T> = Animated.AdaptTransforms<T>;
  export type AnimatedTransform = Animated.AnimatedTransform;
  export type AnimateProps<P extends object> = Animated.AnimateProps<P>;

  export type LayoutAnimation = {
    initialValues: StyleProps;
    animations: AnimateStyle;
  };

  export interface EntryAnimationsValues {
    targetOriginX: number;
    targetOriginY: number;
    targetWidth: number;
    targetHeight: number;
    targetGlobalOriginX: number;
    targetGlobalOriginY: number;
  }

  export enum SensorType {
    ACCELEROMETER = 1,
    GYROSCOPE = 2,
    GRAVITY = 3,
    MAGNETIC_FIELD = 4,
    ROTATION = 5,
  }

  export type SensorConfig = {
    interval: number | 'auto';
  };

  export type Value3D = {
    x: number;
    y: number;
    z: number;
  };

  export type SensorValue3D = SharedValue<Value3D>;

  export type ValueRotation = {
    qw: number;
    qx: number;
    qy: number;
    qz: number;
    yaw: number;
    pitch: number;
    roll: number;
  };

  export type SensorValueRotation = SharedValue<ValueRotation>;

  export type AnimatedSensor<SensorValueType> = {
    sensor: SensorValueType;
    unregister: () => void;
    isAvailable: boolean;
    config: SensorConfig;
  };

  export function useAnimatedSensor(
    sensorType: SensorType.ROTATION,
    userConfig?: SensorConfig
  ): AnimatedSensor<SensorValueRotation>;
  export function useAnimatedSensor(
    sensorType: Exclude<SensorType, SensorType.ROTATION>,
    userConfig?: SensorConfig
  ): AnimatedSensor<SensorValue3D>;
  export function useAnimatedSensor(
    sensorType: SensorType,
    userConfig?: SensorConfig
  ): AnimatedSensor<any>;

  export type FrameCallback = {
    setActive: (isActive: boolean) => void;
    isActive: boolean;
    callbackId: number;
  };
  export type FrameInfo = {
    timestamp: number;
    timeSincePreviousFrame: number | null;
    timeSinceFirstFrame: number;
  };
  export function useFrameCallback(
    callback: (frameInfo: FrameInfo) => void,
    autostart?: boolean
  ): FrameCallback;

  export enum KeyboardState {
    UNKNOWN = 0,
    OPENING = 1,
    OPEN = 2,
    CLOSING = 3,
    CLOSED = 4,
  }
  export type AnimatedKeyboardInfo = {
    height: SharedValue<number>;
    state: SharedValue<KeyboardState>;
  };
  export function useAnimatedKeyboard(): AnimatedKeyboardInfo;

  export function useScrollViewOffset(
    aref: RefObject<Animated.ScrollView>
  ): SharedValue<number>;

  export interface ExitAnimationsValues {
    currentOriginX: number;
    currentOriginY: number;
    currentWidth: number;
    currentHeight: number;
    currentGlobalOriginX: number;
    currentGlobalOriginY: number;
  }

  export type EntryExitAnimationFunction =
    | ((targetValues: EntryAnimationsValues) => LayoutAnimation)
    | ((targetValues: ExitAnimationsValues) => LayoutAnimation);

  export type LayoutAnimationsValues = {
    currentOriginX: number;
    currentOriginY: number;
    currentWidth: number;
    currentHeight: number;
    currentGlobalOriginX: number;
    currentGlobalOriginY: number;
    targetOriginX: number;
    targetOriginY: number;
    targetWidth: number;
    targetHeight: number;
    targetGlobalOriginX: number;
    targetGlobalOriginY: number;
    windowWidth: number;
    windowHeight: number;
  };

  export type LayoutAnimationFunction = (
    targetValues: LayoutAnimationsValues
  ) => LayoutAnimation;

  export interface ILayoutAnimationBuilder {
    build: () => LayoutAnimationFunction;
  }

  export interface IEntryExitAnimationBuilder {
    build: () => EntryExitAnimationFunction;
  }

  export type AnimatableValue = number | string | Array<number>;

  // reanimated2 derived operations
  export enum Extrapolation {
    IDENTITY = 'identity',
    CLAMP = 'clamp',
    EXTEND = 'extend',
  }
  export interface InterpolatedNode {
    __nodeId: number;
  }
  export interface ExtrapolationConfig {
    extrapolateLeft?: Extrapolation | string;
    extrapolateRight?: Extrapolation | string;
  }

  export type ExtrapolationType =
    | ExtrapolationConfig
    | Extrapolation
    | string
    | undefined;

  export function interpolate(
    x: number,
    input: readonly number[],
    output: readonly number[],
    type?: ExtrapolationType
  ): number;

  // reanimated2 animations
  export type AnimationCallback = (
    finished?: boolean,
    current?: AnimatableValue
  ) => void;
  export type EasingFunctionFactory = { factory: () => EasingFunction };
  export interface WithTimingConfig {
    duration?: number;
    easing?: EasingFunction | EasingFunctionFactory;
  }
  export interface WithDecayConfig {
    deceleration?: number;
    velocity?: number;
    clamp?: [number, number];
    velocityFactor?: number;
  }
  export interface WithSpringConfig {
    damping?: number;
    mass?: number;
    stiffness?: number;
    overshootClamping?: boolean;
    restSpeedThreshold?: number;
    restDisplacementThreshold?: number;
    velocity?: number;
  }
  export function withTiming<T extends AnimatableValue>(
    toValue: T,
    userConfig?: WithTimingConfig,
    callback?: AnimationCallback
  ): T;
  export function withSpring<T extends AnimatableValue>(
    toValue: T,
    userConfig?: WithSpringConfig,
    callback?: AnimationCallback
  ): T;
  export function withDecay(
    userConfig: WithDecayConfig,
    callback?: AnimationCallback
  ): number;
  export function cancelAnimation<T>(sharedValue: SharedValue<T>): void;
  export function withDelay<T extends AnimatableValue>(
    delayMS: number,
    delayedAnimation: T
  ): T;
  export function withRepeat<T extends AnimatableValue>(
    animation: T,
    numberOfReps?: number,
    reverse?: boolean,
    callback?: AnimationCallback
  ): T;
  export function withSequence<T extends AnimatableValue>(
    ...animations: [T, ...T[]]
  ): T;

  // reanimated2 functions
  export function runOnUI<A extends any[], R>(
    fn: (...args: A) => R
  ): (...args: Parameters<typeof fn>) => void;
  export function runOnJS<A extends any[], R>(
    fn: (...args: A) => R
  ): (...args: Parameters<typeof fn>) => void;

  type PropsAdapterFunction = (props: Record<string, unknown>) => void;
  export function createAnimatedPropAdapter(
    adapter: PropsAdapterFunction,
    nativeProps?: string[]
  ): PropsAdapterFunction;

  export function processColor(color: number | string): number;

  export type InterpolationOptions = {
    gamma?: number;
    useCorrectedHSVInterpolation?: boolean;
  };

  export function isColor(value: unknown): boolean;

  export function interpolateColor<T extends string | number>(
    value: number,
    inputRange: readonly number[],
    outputRange: readonly T[],
    colorSpace?: 'RGB' | 'HSV',
    options?: InterpolationOptions
  ): T;

  export enum ColorSpace {
    RGB = 0,
    HSV = 1,
  }

  export interface InterpolateRGB {
    r: number[];
    g: number[];
    b: number[];
    a: number[];
  }

  export interface InterpolateHSV {
    h: number[];
    s: number[];
    v: number[];
  }

  export interface InterpolateConfig {
    inputRange: readonly number[];
    outputRange: readonly (string | number)[];
    colorSpace: ColorSpace;
    cache: SharedValue<InterpolateRGB | InterpolateHSV | null>;
  }

  export function useInterpolateConfig(
    inputRange: readonly number[],
    outputRange: readonly (string | number)[],
    colorSpace?: ColorSpace,
    options?: InterpolationOptions
  ): SharedValue<InterpolateConfig>;

  export function interpolateSharableColor(
    value: number,
    interpolateConfig: SharedValue<InterpolateConfig>
  ): string | number;

  export function makeMutable<T>(initialValue: T): SharedValue<T>;

  type DependencyList = ReadonlyArray<any>;

  // reanimated2 hooks
  export function useSharedValue<T>(initialValue: T): SharedValue<T>;

  export function useDerivedValue<T>(
    processor: () => T,
    deps?: DependencyList
  ): DerivedValue<T>;

  export function useAnimatedReaction<D>(
    prepare: () => D,
    react: (prepareResult: D, preparePreviousResult: D | null) => void,
    deps?: DependencyList
  ): void;

  export type AnimatedStyleProp<T> =
    | AnimateStyle<T>
    | RegisteredStyle<AnimateStyle<T>>;
  export function useAnimatedStyle<
    T extends AnimatedStyleProp<ViewStyle | ImageStyle | TextStyle>
  >(updater: () => T, deps?: DependencyList | null): T;
  export function useAnimatedProps<T extends {}>(
    updater: () => Partial<T>,
    deps?: DependencyList | null,
    adapters?: PropsAdapterFunction | PropsAdapterFunction[] | null
  ): Partial<T>;
  export function useEvent<T extends {}>(
    handler: (e: T) => void,
    eventNames?: string[],
    rebuild?: boolean
  ): (e: NativeSyntheticEvent<T>) => void;
  export function useHandler<T, TContext extends Context = {}>(
    handlers: Record<string, Handler<T, TContext>>,
    deps?: DependencyList
  ): { context: TContext; doDependenciesDiffer: boolean; useWeb: boolean };
  export function useAnimatedGestureHandler<
    T extends GestureHandlerGestureEvent = PanGestureHandlerGestureEvent,
    TContext extends Context = {}
  >(
    handlers: GestureHandlers<T['nativeEvent'], TContext>,
    deps?: DependencyList
  ): OnGestureEvent<T>;
  export function useAnimatedScrollHandler<TContext extends Context = {}>(
    handlers: ScrollHandlers<TContext> | ScrollHandler<TContext>,
    deps?: DependencyList
  ): OnScroll;
  export function useWorkletCallback<A extends any[], R>(
    fn: (...args: A) => R,
    deps?: DependencyList
  ): (...args: Parameters<typeof fn>) => R;

  export function useAnimatedRef<T extends Component>(): RefObject<T>;
  export function defineAnimation<T>(starting: any, factory: () => T): number;
  export function measure<T extends Component>(
    ref: RefObject<T>
  ): MeasuredDimensions | null;

  export function getRelativeCoords(
    ref: RefObject<Component>,
    x: number,
    y: number
  ): {
    x: number;
    y: number;
  };

  export function scrollTo(
    ref: RefObject<ReactNativeScrollView | ScrollView>,
    x: number,
    y: number,
    animated: boolean
  ): void;

  // gesture-handler
  type OnGestureEvent<T extends GestureHandlerGestureEvent> = (
    event: T
  ) => void;

  type Context = Record<string, unknown>;

  type Handler<T, TContext extends Context> = (
    event: T,
    context: TContext
  ) => void;

  export interface GestureHandlers<T, TContext extends Context> {
    onStart?: Handler<T, TContext>;
    onActive?: Handler<T, TContext>;
    onEnd?: Handler<T, TContext>;
    onFail?: Handler<T, TContext>;
    onCancel?: Handler<T, TContext>;
    onFinish?: (
      event: T,
      context: TContext,
      isCanceledOrFailed: boolean
    ) => void;
  }

  // scroll view
  type OnScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  type ScrollHandler<TContext extends Context> = (
    event: NativeScrollEvent,
    context: TContext
  ) => void;

  export interface ScrollHandlers<TContext extends Context> {
    onScroll?: ScrollHandler<TContext>;
    onBeginDrag?: ScrollHandler<TContext>;
    onEndDrag?: ScrollHandler<TContext>;
    onMomentumBegin?: ScrollHandler<TContext>;
    onMomentumEnd?: ScrollHandler<TContext>;
  }
  export interface StyleProps extends ViewStyle, TextStyle {
    originX?: number;
    originY?: number;
    [key: string]: any;
  }
  export type EasingFn = (t: number) => number;
  export interface KeyframeProps extends StyleProps {
    easing?: EasingFn;
    [key: string]: any;
  }
  export class Keyframe {
    constructor(definitions: Record<string, KeyframeProps>);
    duration(durationMs: number): Keyframe;
    delay(delayMs: number): Keyframe;
    withCallback(callback: (finished: boolean) => void): Keyframe;
  }
  export class BaseAnimationBuilder {
    static duration(durationMs: number): BaseAnimationBuilder;
    duration(durationMs: number): BaseAnimationBuilder;
    static delay(durationMs: number): BaseAnimationBuilder;
    delay(durationMs: number): BaseAnimationBuilder;
    static withCallback(
      callback: (finished: boolean) => void
    ): BaseAnimationBuilder;

    withCallback(callback: (finished: boolean) => void): BaseAnimationBuilder;
    static randomDelay(): BaseAnimationBuilder;
    randomDelay(): BaseAnimationBuilder;
    build: () => LayoutAnimationFunction | EntryExitAnimationFunction;
  }

  export class ComplexAnimationBuilder extends BaseAnimationBuilder {
    static duration(durationMs: number): ComplexAnimationBuilder;
    duration(durationMs: number): ComplexAnimationBuilder;
    static delay(durationMs: number): ComplexAnimationBuilder;
    delay(durationMs: number): ComplexAnimationBuilder;
    static withCallback(
      callback: (finished: boolean) => void
    ): ComplexAnimationBuilder;

    withCallback(
      callback: (finished: boolean) => void
    ): ComplexAnimationBuilder;

    static withInitialValues(values: StyleProps): BaseAnimationBuilder;
    withInitialValues(values: StyleProps): BaseAnimationBuilder;

    static easing(easingFunction: EasingFunction): ComplexAnimationBuilder;
    easing(easingFunction: EasingFunction): ComplexAnimationBuilder;
    static springify(): ComplexAnimationBuilder;
    springify(): ComplexAnimationBuilder;
    static damping(dampingFactor: number): ComplexAnimationBuilder;
    damping(dampingFactor: number): ComplexAnimationBuilder;
    static mass(mass: number): ComplexAnimationBuilder;
    mass(mass: number): ComplexAnimationBuilder;
    static stiffness(stiffnessFactor: number): ComplexAnimationBuilder;
    stiffness(stiffnessFactor: number): ComplexAnimationBuilder;
    static overshootClamping(
      overshootClampingFactor: number
    ): ComplexAnimationBuilder;

    overshootClamping(overshootClampingFactor: number): ComplexAnimationBuilder;

    static restDisplacementThreshold(
      restDisplacementThresholdFactor: number
    ): ComplexAnimationBuilder;

    restDisplacementThreshold(
      restDisplacementThresholdFactor: number
    ): ComplexAnimationBuilder;

    static restSpeedThreshold(
      restSpeedThresholdFactor: number
    ): ComplexAnimationBuilder;

    restSpeedThreshold(
      restSpeedThresholdFactor: number
    ): ComplexAnimationBuilder;
  }

  export class Layout extends ComplexAnimationBuilder {}
  export class FadingTransition extends BaseAnimationBuilder {}
  export class SequencedTransition extends BaseAnimationBuilder {
    static reverse(): SequencedTransition;
    reverse(): SequencedTransition;
  }
  export class JumpingTransition extends BaseAnimationBuilder {}
  export class CurvedTransition extends BaseAnimationBuilder {
    static delay(durationMs: number): CurvedTransition;
    delay(durationMs: number): CurvedTransition;
    static easingX(easing: EasingFn): CurvedTransition;

    easingX(easing: EasingFn): CurvedTransition;

    static easingY(easing: EasingFn): CurvedTransition;

    easingY(easing: EasingFn): CurvedTransition;

    static easingWidth(easing: EasingFn): CurvedTransition;

    easingWidth(easing: EasingFn): CurvedTransition;

    static easingHeight(easing: EasingFn): CurvedTransition;

    easingHeight(easing: EasingFn): CurvedTransition;
  }
  export class EntryExitTransition extends BaseAnimationBuilder {
    static delay(durationMs: number): EntryExitTransition;
    delay(durationMs: number): EntryExitTransition;
    static entering(
      animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
    ): EntryExitTransition;

    entering(
      animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
    ): EntryExitTransition;

    static exiting(
      animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
    ): EntryExitTransition;

    exiting(
      animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
    ): EntryExitTransition;
  }
  export function combineTransition(
    exiting: BaseAnimationBuilder | typeof BaseAnimationBuilder,
    entering: BaseAnimationBuilder | typeof BaseAnimationBuilder
  ): EntryExitTransition;
  export class SlideInRight extends ComplexAnimationBuilder {}
  export class SlideOutRight extends ComplexAnimationBuilder {}
  export class SlideInUp extends ComplexAnimationBuilder {}
  export class SlideInDown extends ComplexAnimationBuilder {}
  export class SlideOutUp extends ComplexAnimationBuilder {}
  export class SlideOutDown extends ComplexAnimationBuilder {}
  export class FadeIn extends ComplexAnimationBuilder {}
  export class FadeInRight extends ComplexAnimationBuilder {}
  export class FadeInLeft extends ComplexAnimationBuilder {}
  export class FadeInUp extends ComplexAnimationBuilder {}
  export class FadeInDown extends ComplexAnimationBuilder {}
  export class FadeOut extends ComplexAnimationBuilder {}
  export class FadeOutRight extends ComplexAnimationBuilder {}
  export class FadeOutLeft extends ComplexAnimationBuilder {}
  export class FadeOutUp extends ComplexAnimationBuilder {}
  export class FadeOutDown extends ComplexAnimationBuilder {}
  export class SlideOutLeft extends ComplexAnimationBuilder {}
  export class SlideInLeft extends ComplexAnimationBuilder {}
  export class ZoomIn extends ComplexAnimationBuilder {}
  export class ZoomInRotate extends ComplexAnimationBuilder {}
  export class ZoomInRight extends ComplexAnimationBuilder {}
  export class ZoomInLeft extends ComplexAnimationBuilder {}
  export class ZoomInUp extends ComplexAnimationBuilder {}
  export class ZoomInDown extends ComplexAnimationBuilder {}
  export class ZoomInEasyUp extends ComplexAnimationBuilder {}
  export class ZoomInEasyDown extends ComplexAnimationBuilder {}
  export class ZoomOut extends ComplexAnimationBuilder {}
  export class ZoomOutRotate extends ComplexAnimationBuilder {}
  export class ZoomOutRight extends ComplexAnimationBuilder {}
  export class ZoomOutLeft extends ComplexAnimationBuilder {}
  export class ZoomOutUp extends ComplexAnimationBuilder {}
  export class ZoomOutDown extends ComplexAnimationBuilder {}
  export class ZoomOutEasyUp extends ComplexAnimationBuilder {}
  export class ZoomOutEasyDown extends ComplexAnimationBuilder {}
  export class StretchInX extends ComplexAnimationBuilder {}
  export class StretchInY extends ComplexAnimationBuilder {}
  export class StretchOutX extends ComplexAnimationBuilder {}
  export class StretchOutY extends ComplexAnimationBuilder {}
  export class FlipInXUp extends ComplexAnimationBuilder {}
  export class FlipInYLeft extends ComplexAnimationBuilder {}
  export class FlipInXDown extends ComplexAnimationBuilder {}
  export class FlipInYRight extends ComplexAnimationBuilder {}
  export class FlipInEasyX extends ComplexAnimationBuilder {}
  export class FlipInEasyY extends ComplexAnimationBuilder {}
  export class FlipOutXUp extends ComplexAnimationBuilder {}
  export class FlipOutYLeft extends ComplexAnimationBuilder {}
  export class FlipOutXDown extends ComplexAnimationBuilder {}
  export class FlipOutYRight extends ComplexAnimationBuilder {}
  export class FlipOutEasyX extends ComplexAnimationBuilder {}
  export class FlipOutEasyY extends ComplexAnimationBuilder {}
  export class BounceIn extends BaseAnimationBuilder {}
  export class BounceInDown extends BaseAnimationBuilder {}
  export class BounceInUp extends BaseAnimationBuilder {}
  export class BounceInLeft extends BaseAnimationBuilder {}
  export class BounceInRight extends BaseAnimationBuilder {}
  export class BounceOut extends BaseAnimationBuilder {}
  export class BounceOutDown extends BaseAnimationBuilder {}
  export class BounceOutUp extends BaseAnimationBuilder {}
  export class BounceOutLeft extends BaseAnimationBuilder {}
  export class BounceOutRight extends BaseAnimationBuilder {}
  export class LightSpeedInRight extends ComplexAnimationBuilder {}
  export class LightSpeedInLeft extends ComplexAnimationBuilder {}
  export class LightSpeedOutRight extends ComplexAnimationBuilder {}
  export class LightSpeedOutLeft extends ComplexAnimationBuilder {}
  export class PinwheelIn extends ComplexAnimationBuilder {}
  export class PinwheelOut extends ComplexAnimationBuilder {}
  export class RotateInDownLeft extends ComplexAnimationBuilder {}
  export class RotateInDownRight extends ComplexAnimationBuilder {}
  export class RotateInUpRight extends ComplexAnimationBuilder {}
  export class RotateInUpLeft extends ComplexAnimationBuilder {}
  export class RotateOutDownRight extends ComplexAnimationBuilder {}
  export class RotateOutDownLeft extends ComplexAnimationBuilder {}
  export class RotateOutUpLeft extends ComplexAnimationBuilder {}
  export class RotateOutUpRight extends ComplexAnimationBuilder {}
  export class RollInLeft extends ComplexAnimationBuilder {}
  export class RollInRight extends ComplexAnimationBuilder {}
  export class RollOutLeft extends ComplexAnimationBuilder {}
  export class RollOutRight extends ComplexAnimationBuilder {}
  interface EasingNodeStatic {
    linear: Animated.EasingNodeFunction;
    ease: Animated.EasingNodeFunction;
    quad: Animated.EasingNodeFunction;
    cubic: Animated.EasingNodeFunction;
    poly(n: Animated.Adaptable<number>): Animated.EasingNodeFunction;
    sin: Animated.EasingNodeFunction;
    circle: Animated.EasingNodeFunction;
    exp: Animated.EasingNodeFunction;
    elastic(
      bounciness?: Animated.Adaptable<number>
    ): Animated.EasingNodeFunction;
    back(s?: Animated.Adaptable<number>): Animated.EasingNodeFunction;
    bounce: Animated.EasingNodeFunction;
    bezier(
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): Animated.EasingNodeFunction;
    in(easing: Animated.EasingNodeFunction): Animated.EasingNodeFunction;
    out(easing: Animated.EasingNodeFunction): Animated.EasingNodeFunction;
    inOut(easing: Animated.EasingNodeFunction): Animated.EasingNodeFunction;
  }

  export const EasingNode: EasingNodeStatic;

  interface EasingStatic {
    linear: Animated.EasingFunction;
    ease: Animated.EasingFunction;
    quad: Animated.EasingFunction;
    cubic: Animated.EasingFunction;
    poly(n: number): Animated.EasingFunction;
    sin: Animated.EasingFunction;
    circle: Animated.EasingFunction;
    exp: Animated.EasingFunction;
    elastic(bounciness?: number): Animated.EasingFunction;
    back(s?: number): Animated.EasingFunction;
    bounce: Animated.EasingFunction;
    bezier(
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): { factory: () => Animated.EasingFunction };
    bezierFn(
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ): Animated.EasingFunction;
    in(easing: Animated.EasingFunction): Animated.EasingFunction;
    out(easing: Animated.EasingFunction): Animated.EasingFunction;
    inOut(easing: Animated.EasingFunction): Animated.EasingFunction;
  }

  export const Easing: EasingStatic;

  export interface TransitioningViewProps extends ViewProps {
    transition: ReactNode;
  }

  export class TransitioningView extends Component<TransitioningViewProps> {
    animateNextTransition(): void;
  }

  export class Transitioning extends Component {
    static View: typeof TransitioningView;
  }

  export interface TransitionProps {
    delayMs?: number;
    durationMs?: number;
    interpolation?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
    propagation?: 'top' | 'bottom' | 'left' | 'right';
  }

  export interface TransitionInOutProps extends TransitionProps {
    type?:
      | 'fade'
      | 'scale'
      | 'slide-top'
      | 'slide-bottom'
      | 'slide-right'
      | 'slide-left';
  }
  export class Transition extends Component {
    static In: ComponentClass<TransitionInOutProps>;
    static Out: ComponentClass<TransitionInOutProps>;
    static Change: ComponentClass<TransitionProps>;
    static Together: ComponentClass<{}>;
    static Sequence: ComponentClass<{}>;
  }

  export class Clock extends Animated.Clock {}
  export class Value<
    T extends string | number | boolean
  > extends Animated.Value<T> {}
  export class Node<T> extends Animated.Node<T> {}
  export const add: typeof Animated.add;
  export const sub: typeof Animated.sub;
  export const multiply: typeof Animated.multiply;
  export const divide: typeof Animated.divide;
  export const pow: typeof Animated.pow;
  export const modulo: typeof Animated.modulo;
  export const sqrt: typeof Animated.sqrt;
  export const log: typeof Animated.log;
  export const sin: typeof Animated.sin;
  export const cos: typeof Animated.cos;
  export const exp: typeof Animated.exp;
  export const round: typeof Animated.round;
  export const lessThan: typeof Animated.lessThan;
  export const eq: typeof Animated.eq;
  export const greaterThan: typeof Animated.greaterThan;
  export const lessOrEq: typeof Animated.lessOrEq;
  export const greaterOrEq: typeof Animated.greaterOrEq;
  export const neq: typeof Animated.neq;
  export const and: typeof Animated.and;
  export const or: typeof Animated.or;
  export const defined: typeof Animated.defined;
  export const not: typeof Animated.not;
  export const tan: typeof Animated.tan;
  export const acos: typeof Animated.acos;
  export const asin: typeof Animated.asin;
  export const atan: typeof Animated.atan;
  export const proc: typeof Animated.proc;
  export const block: typeof Animated.block;
  export const concat: typeof Animated.concat;
  export const event: typeof Animated.event;
  export const call: typeof Animated.call;
  export const debug: typeof Animated.debug;
  export const clockRunning: typeof Animated.clockRunning;
  export const stopClock: typeof Animated.stopClock;
  export const startClock: typeof Animated.startClock;
  export const set: typeof Animated.set;
  export const cond: typeof Animated.cond;
  export const abs: typeof Animated.abs;
  export const acc: typeof Animated.acc;
  export const color: typeof Animated.color;
  export const interpolateColors: typeof Animated.interpolateColors;
  export const diff: typeof Animated.diff;
  export const diffClamp: typeof Animated.diffClamp;
  export const interpolateNode: typeof Animated.interpolateNode;
  export const Extrapolate: typeof Animated.Extrapolate;
  export const max: typeof Animated.max;
  export const min: typeof Animated.min;
  export const onChange: typeof Animated.onChange;
  export const floor: typeof Animated.floor;
  export const ceil: typeof Animated.ceil;
  export const useCode: typeof Animated.useCode;
  export const decay: typeof Animated.decay;
  export const timing: typeof Animated.timing;
  export const spring: typeof Animated.spring;
  export const SpringUtils: typeof Animated.SpringUtils;
  export const useValue: typeof Animated.useValue;
  export const ReverseAnimation: typeof Animated.ReverseAnimation;
  export function enableLayoutAnimations(flag: boolean): void;
}
