import { Image, ImageProps } from 'expo-image';
import React from 'react';
import { Animated, ImageProps as RNImageProps, Image as RNImage } from 'react-native';

import { anyAnimationDriver, jsOnlyAnimationDriver } from './tests/constants';

export type ImageTestEventHandler = (...args: any) => void;

export type ImageTestPropsFnInput = {
  range: (start: number, end: number) => number | Animated.AnimatedInterpolation<number> | string;
  event: (name: string) => ImageTestEventHandler;
};

export type ImageTestProps = any;

export type ImageTestPropsFn = (input: ImageTestPropsFnInput) => ImageTestProps;

// Use React.ElementType to avoid "union type too complex" errors
// when ImageProps includes large union types like sf:${SFSymbol}
export type ImageTestComponent = React.ElementType;

export interface ImageTest {
  name: string;
  props: ImageTestProps | ImageTestPropsFn;
  loadOnDemand?: boolean;
  testInformation?: string;
  animationDriver?: typeof jsOnlyAnimationDriver | typeof anyAnimationDriver;
}

export interface ImageTestGroup {
  name: string;
  tests: ImageTest[];
  description?: string;
}
