import { EasingFn } from '../../Easing';
import { StyleProps } from '../../commonTypes';

export interface KeyframeProps extends StyleProps {
  easing?: EasingFn;
  [key: string]: any;
}

export type LayoutAnimation = {
  initialValues: StyleProps;
  animations: StyleProps;
  callback?: (finished: boolean) => void;
};

export type AnimationFunction = (a?: any, b?: any, c?: any) => any; // this is just a temporary mock

export interface EntryAnimationsValues {
  targetOriginX: number;
  targetOriginY: number;
  targetWidth: number;
  targetHeight: number;
  targetGlobalOriginX: number;
  targetGlobalOriginY: number;
}

export interface ExitAnimationsValues {
  currentOriginX: number;
  currentOriginY: number;
  currentWidth: number;
  currentHeight: number;
  currentGlobalOriginX: number;
  currentGlobalOriginY: number;
}

export type EntryExitAnimationFunction = (
  targetValues: EntryAnimationsValues | ExitAnimationsValues
) => LayoutAnimation;

export type AnimationConfigFunction<T> = (targetValues: T) => LayoutAnimation;

export interface LayoutAnimationsValues {
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
}

export type LayoutAnimationFunction = (
  targetValues: LayoutAnimationsValues
) => LayoutAnimation;

export interface ILayoutAnimationBuilder {
  build: () => LayoutAnimationFunction;
}

export interface BaseLayoutAnimationConfig {
  duration?: number;
  easing?: EasingFn;
  type?: AnimationFunction;
  damping?: number;
  mass?: number;
  stiffness?: number;
  overshootClamping?: number;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export interface BaseBuilderAnimationConfig extends BaseLayoutAnimationConfig {
  rotate?: number | string;
}

export type LayoutAnimationAndConfig = [
  AnimationFunction,
  BaseBuilderAnimationConfig
];

export interface IEntryExitAnimationBuilder {
  build: () => EntryExitAnimationFunction;
}

export interface IEntryAnimationBuilder {
  build: () => AnimationConfigFunction<EntryAnimationsValues>;
}

export interface IExitAnimationBuilder {
  build: () => AnimationConfigFunction<ExitAnimationsValues>;
}
