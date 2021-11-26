import { Component } from 'react';
import { GestureResponderEvent } from 'react-native';

export type NumberProp = string | number;
export type NumberArray = NumberProp[] | NumberProp;

// rgbaArray = [r, g, b, a]
export type rgbaArray = number[];
// int32ARGBColor = 0xaarrggbb
export type Int32ARGBColor = number;
export type Color = Int32ARGBColor | rgbaArray | string;

export type Linecap = 'butt' | 'square' | 'round';
export type Linejoin = 'miter' | 'bevel' | 'round';
export type VectorEffect =
  | 'none'
  | 'non-scaling-stroke'
  | 'nonScalingStroke'
  | 'default'
  | 'inherit'
  | 'uri';

export interface TransformProps {
  translate?: NumberArray;
  translateX?: NumberProp;
  translateY?: NumberProp;
  origin?: NumberArray;
  originX?: NumberProp;
  originY?: NumberProp;
  scale?: NumberArray;
  scaleX?: NumberProp;
  scaleY?: NumberProp;
  skew?: NumberArray;
  skewX?: NumberProp;
  skewY?: NumberProp;
  rotation?: NumberProp;
  x?: NumberArray;
  y?: NumberArray;
  transform?: number[] | string | TransformProps | void | undefined;
}

export interface TransformedProps {
  rotation: number;
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  x: number;
  y: number;
}

export type ResponderProps = {
  onPress?: () => void;
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  delayPressIn?: number;
  delayPressOut?: number;
  delayLongPress?: number;
  pointerEvents?: string;
};
export type ResponderInstanceProps = {
  touchableHandleResponderMove?: (e: GestureResponderEvent) => void;
  touchableHandleResponderGrant?: (e: GestureResponderEvent) => void;
  touchableHandleResponderRelease?: (e: GestureResponderEvent) => void;
  touchableHandleResponderTerminate?: (e: GestureResponderEvent) => void;
  touchableHandleStartShouldSetResponder?: (
    e: GestureResponderEvent,
  ) => boolean;
  touchableHandleResponderTerminationRequest?: (
    e: GestureResponderEvent,
  ) => boolean;
};
export type FillProps = {
  fill?: Color;
  fillRule?: 'evenodd' | 'nonzero';
  fillOpacity?: NumberProp;
};
export type StrokeProps = {
  stroke?: Color;
  strokeWidth?: NumberProp;
  strokeOpacity?: NumberProp;
  strokeDasharray?: NumberArray;
  strokeDashoffset?: NumberProp;
  strokeLinecap?: Linecap;
  strokeLinejoin?: Linejoin;
  strokeMiterlimit?: NumberProp;
  vectorEffect?: VectorEffect;
};
export type ClipProps = {
  clipPath?: string;
  clipRule?: 'evenodd' | 'nonzero';
};
export type extractedProps = {
  name?: string;
  mask?: string;
  opacity?: number;
  matrix?: number[];
  propList?: string[];
  onLayout?: () => void;
  ref?: (instance: Component | null) => void;
  markerStart?: string;
  markerMid?: string;
  markerEnd?: string;
  clipPath?: string;
  clipRule?: number;
  display?: string;
  [touchableProperty: string]: unknown;
};
