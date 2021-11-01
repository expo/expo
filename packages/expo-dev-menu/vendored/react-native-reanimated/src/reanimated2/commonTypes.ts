import {
  PerpectiveTransform,
  RotateTransform,
  RotateXTransform,
  RotateYTransform,
  RotateZTransform,
  ScaleTransform,
  ScaleXTransform,
  ScaleYTransform,
  TranslateXTransform,
  TranslateYTransform,
  SkewXTransform,
  SkewYTransform,
  MatrixTransform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Animation, AnimationObject } from './animation/commonTypes';
import { Context } from './hook/commonTypes';

export type TransformProperty =
  | PerpectiveTransform
  | RotateTransform
  | RotateXTransform
  | RotateYTransform
  | RotateZTransform
  | ScaleTransform
  | ScaleXTransform
  | ScaleYTransform
  | TranslateXTransform
  | TranslateYTransform
  | SkewXTransform
  | SkewYTransform
  | MatrixTransform;

export interface StyleProps extends ViewStyle, TextStyle {
  originX?: number;
  originY?: number;
  [key: string]: any;
}

export interface AnimatedStyle
  extends Record<string, Animation<AnimationObject>> {
  [key: string]: any;
  transform?: Array<Record<string, Animation<AnimationObject>>>;
}
export interface SharedValue<T> {
  value: T;
}

export interface WorkletFunction {
  _closure?: Context;
  __workletHash?: number;
  __optimalization?: number;
  __worklet?: boolean;
}

export interface BasicWorkletFunction<T> extends WorkletFunction {
  (): T;
}

export interface ComplexWorkletFunction<A extends any[], R>
  extends WorkletFunction {
  (...args: A): R;
}

export interface NestedObject<T> {
  [key: string]: NestedObjectValues<T>;
}

export type NestedObjectValues<T> =
  | T
  | Array<NestedObjectValues<T>>
  | NestedObject<T>;

export interface AdapterWorkletFunction extends WorkletFunction {
  (value: NestedObject<string | number | AnimationObject>): void;
}
