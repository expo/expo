// Project: https://github.com/software-mansion/react-native-reanimated
// TypeScript Version: 2.8

declare module 'react-native-reanimated' {
  import { ComponentClass, ReactNode, Component } from 'react';
  import {
    ViewProps,
    TextProps,
    ImageProps,
    ScrollViewProps,
    StyleProp,
    ViewStyle,
    TextStyle,
    ImageStyle,
    TransformsStyle,
    View as ReactNativeView,
    Text as ReactNativeText,
    Image as ReactNativeImage,
    ScrollView as ReactNativeScrollView
  } from 'react-native';
  namespace Animated {
    type Nullable<T> = T | null | undefined;

    class AnimatedNode<T> {
      constructor(
        nodeConfig: object,
        inputNodes?: ReadonlyArray<AnimatedNode<any>>,
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

    interface InterpolationConfig {
      inputRange: ReadonlyArray<Adaptable<number>>;
      outputRange: ReadonlyArray<Adaptable<number>>;
      extrapolate?: Extrapolate;
      extrapolateLeft?: Extrapolate;
      extrapolateRight?: Extrapolate;
    }
    type Value = string | number | boolean;
    class AnimatedValue<T extends Value> extends AnimatedNode<T> {
      constructor(value?: T);

      setValue(value: Adaptable<T>): void;

      interpolate(config: InterpolationConfig): AnimatedNode<number>;
    }

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

    export interface AnimationState {
      finished: AnimatedValue<number>;
      position: AnimatedValue<number>;
      time: AnimatedValue<number>;
    }

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
    export type EasingFunction = (value: Adaptable<number>) => AnimatedNode<number>;
    export interface TimingConfig {
      toValue: Adaptable<number>;
      duration: Adaptable<number>;
      easing: EasingFunction;
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

    type SpringUtils =  {
      makeDefaultConfig: () => SpringConfig;
      makeConfigFromBouncinessAndSpeed: (prevConfig: SpringConfigWithBouncinessAndSpeed) => SpringConfig;
      makeConfigFromOrigamiTensionAndFriction: (prevConfig: SpringConfigWithOrigamiTensionAndFriction) => SpringConfig
    }

    export const SpringUtils: SpringUtils

    export type TransformStyleTypes = TransformsStyle['transform'] extends (readonly (infer T)[] | undefined) ? T : never
    export type AdaptTransforms<T> = { [P in keyof T]: Adaptable<T[P] extends string ? number | string : T[P]> }
    export type AnimatedTransform = (AdaptTransforms<TransformStyleTypes>)[]

    export type AnimateStyle<S extends object> = {
      [K in keyof S]: K extends 'transform' ? AnimatedTransform : (S[K] extends ReadonlyArray<any>
        ? ReadonlyArray<AnimateStyle<S[K][0]>>
        : S[K] extends object
          ? AnimateStyle<S[K]>
          :
              | S[K]
              | AnimatedNode<
                  // allow `number` where `string` normally is to support colors
                  S[K] extends (string | undefined) ? S[K] | number : S[K]
                >)
    };

    export type AnimateProps<
      S extends object,
      P extends {
        style?: StyleProp<S>;
      }
    > = {
      [K in keyof P]: K extends 'style'
        ? StyleProp<AnimateStyle<S>>
        : P[K] | AnimatedNode<P[K]>
    };

    type CodeProps = {
      exec?: AnimatedNode<number>
      children?: () => AnimatedNode<number>
    };

    // components
    export class View extends Component<AnimateProps<ViewStyle, ViewProps>> {
      getNode(): ReactNativeView;
    }
    export class Text extends Component<AnimateProps<TextStyle, TextProps>> {
      getNode(): ReactNativeText;
    }
    export class Image extends Component<
      AnimateProps<ImageStyle, ImageProps>
    > {
      getNode(): ReactNativeImage;
    }
    export class ScrollView extends Component<
      AnimateProps<ViewStyle, ScrollViewProps>
    > {
      getNode(): ReactNativeScrollView;
    }
    export class Code extends Component<CodeProps> {}
    export function createAnimatedComponent(component: any): any;

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
      sourceNode: Adaptable<T>,
    ): AnimatedNode<T>;
    export function concat(
      ...args: Array<Adaptable<string> | Adaptable<number>>,
    ): AnimatedNode<string>;
    export function cond<T1 extends Value = number, T2 extends Value = number>(
      conditionNode: Adaptable<number>,
      ifNode: Adaptable<T1>,
      elseNode?: Adaptable<T2>,
    ): AnimatedNode<T1 | T2>;
    export function block<T1 extends Value = number, T2 extends Value = any>(
      items: ReadonlyArray<Adaptable<T2>>,
    ): AnimatedNode<T1>;
    export function call<T>(
      args: ReadonlyArray<T | AnimatedNode<T>>,
      callback: (args: ReadonlyArray<T>) => void,
    ): AnimatedNode<0>;
    export function debug<T>(
      message: string,
      value: AnimatedNode<T>,
    ): AnimatedNode<T>;
    export function onChange(
      value: Adaptable<number>,
      action: Adaptable<number>,
    ): AnimatedNode<number>;
    export function startClock(clock: AnimatedClock): AnimatedNode<0>;
    export function stopClock(clock: AnimatedClock): AnimatedNode<0>;
    export function clockRunning(clock: AnimatedClock): AnimatedNode<0 | 1>;
    // the return type for `event` is a lie, but it's the same lie that
    // react-native makes within Animated
    type EventArgFunc<T> = (arg: T) => AnimatedNode<number>;
    type EventMapping<T> = T extends object ? { [K in keyof T]?: EventMapping<T[K]> | EventArgFunc<T[K]> } : Adaptable<T> | EventArgFunc<T>;
    type EventMappingArray<T> = T extends Array<any> ? { [I in keyof T]: EventMapping<T[I]> } : [EventMapping<T>]
    export function event<T>(
        argMapping: T extends never ? ReadonlyArray<Mapping> : Readonly<EventMappingArray<T>>,
        config?: {},
    ): (...args: any[]) => void;

    // derived operations
    export function abs(value: Adaptable<number>): AnimatedNode<number>;
    export function acc(value: Adaptable<number>): AnimatedNode<number>;
    export function color(
      r: Adaptable<number>,
      g: Adaptable<number>,
      b: Adaptable<number>,
      a?: Adaptable<number>,
    ): AnimatedNode<number>;
    export function diff(value: Adaptable<number>): AnimatedNode<number>;
    export function diffClamp(
      value: Adaptable<number>,
      minVal: Adaptable<number>,
      maxVal: Adaptable<number>,
    ): AnimatedNode<number>;
    export function interpolate(
      value: Adaptable<number>,
      config: InterpolationConfig,
    ): AnimatedNode<number>;
    export function interpolateColors(
      animationValue: Adaptable<number>,
      {
        inputRange,
        outputColorRange
      }: {
        inputRange: ReadonlyArray<Adaptable<number>>;
        outputColorRange: (string | number)[];
      }
    ): AnimatedNode<number>;
    export const max: BinaryOperator;
    export const min: BinaryOperator;

    // animations
    export function decay(
      clock: AnimatedClock,
      state: DecayState,
      config: DecayConfig,
    ): AnimatedNode<number>;
    export function timing(
      clock: AnimatedClock,
      state: TimingState,
      config: TimingConfig,
    ): AnimatedNode<number>;
    export function spring(
      clock: AnimatedClock,
      state: SpringState,
      config: SpringConfig,
    ): AnimatedNode<number>;
    // backward compatible API
    export function spring(
      node: AnimatedNode<number>,
      config: SpringConfig,
    ): BackwardCompatibleWrapper;
    export function timing(
      node: AnimatedNode<number>,
      config: TimingConfig,
    ): BackwardCompatibleWrapper;
    export function decay(
      node: AnimatedNode<number>,
      config: DecayConfig,
    ): BackwardCompatibleWrapper;

    // hooks
    export function useCode(
      exec: () => Nullable< AnimatedNode<number>[] | AnimatedNode<number> > | boolean,
      deps: Array<any>,
    ): void
    export function useValue<T extends Value>(
      initialValue: T
    ): AnimatedValue<T>;

    // configuration
    export function addWhitelistedNativeProps(props: { [key: string]: true }): void;
    export function addWhitelistedUIProps(props: { [key: string]: true }): void;
  }

  export default Animated;

  interface EasingStatic {
    linear: Animated.EasingFunction;
    ease: Animated.EasingFunction;
    quad: Animated.EasingFunction;
    cubic: Animated.EasingFunction;
    poly(n: Animated.Adaptable<number>): Animated.EasingFunction;
    sin: Animated.EasingFunction;
    circle: Animated.EasingFunction;
    exp: Animated.EasingFunction;
    elastic(bounciness?: Animated.Adaptable<number>): Animated.EasingFunction;
    back(s?: Animated.Adaptable<number>): Animated.EasingFunction;
    bounce: Animated.EasingFunction;
    bezier(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
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
    type?: 'fade' | 'scale' | 'slide-top' | 'slide-bottom' | 'slide-right' | 'slide-left';
  }

  export class Transition extends Component {
    static In: ComponentClass<TransitionInOutProps>;
    static Out: ComponentClass<TransitionInOutProps>;
    static Change: ComponentClass<TransitionProps>;
    static Together: ComponentClass<{}>;
    static Sequence: ComponentClass<{}>;
  }

  export class Clock extends Animated.Clock {}
  export class Value<T extends string | number | boolean> extends Animated.Value<T> {}
  export class Node<T> extends Animated.Node<T> {}
  export const add: typeof Animated.add
  export const sub: typeof Animated.sub
  export const multiply: typeof Animated.multiply
  export const divide: typeof Animated.divide
  export const pow: typeof Animated.pow
  export const modulo: typeof Animated.modulo
  export const sqrt: typeof Animated.sqrt
  export const log: typeof Animated.log
  export const sin: typeof Animated.sin
  export const cos: typeof Animated.cos
  export const exp: typeof Animated.exp
  export const round: typeof Animated.round
  export const lessThan: typeof Animated.lessThan
  export const eq: typeof Animated.eq
  export const greaterThan: typeof Animated.greaterThan
  export const lessOrEq: typeof Animated.lessOrEq
  export const greaterOrEq: typeof Animated.greaterOrEq
  export const neq: typeof Animated.neq
  export const and: typeof Animated.and
  export const or: typeof Animated.or
  export const defined: typeof Animated.defined
  export const not: typeof Animated.not
  export const tan: typeof Animated.tan
  export const acos: typeof Animated.acos
  export const asin: typeof Animated.asin
  export const atan: typeof Animated.atan
  export const proc: typeof Animated.proc
  export const block: typeof Animated.block
  export const concat: typeof Animated.concat
  export const event: typeof Animated.event
  export const call: typeof Animated.call
  export const debug: typeof Animated.debug
  export const clockRunning: typeof Animated.clockRunning
  export const stopClock: typeof Animated.stopClock
  export const startClock: typeof Animated.startClock
  export const set: typeof Animated.set
  export const cond: typeof Animated.cond
  export const abs: typeof Animated.abs
  export const acc: typeof Animated.acc
  export const color: typeof Animated.color
  export const interpolateColors: typeof Animated.interpolateColors
  export const diff: typeof Animated.diff
  export const diffClamp: typeof Animated.diffClamp
  export const interpolate: typeof Animated.interpolate
  export const Extrapolate: typeof Animated.Extrapolate
  export const max: typeof Animated.max
  export const min: typeof Animated.min
  export const onChange: typeof Animated.onChange
  export const floor: typeof Animated.floor
  export const ceil: typeof Animated.ceil
  export const useCode: typeof Animated.useCode
  export const decay: typeof Animated.decay
  export const timing: typeof Animated.timing
  export const spring: typeof Animated.spring
  export const SpringUtils: typeof Animated.SpringUtils
  export const useValue: typeof Animated.useValue
}
