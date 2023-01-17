import { ImageProps } from 'expo-image';
import React from 'react';
import { Animated, ImageProps as RNImageProps } from 'react-native';

export type ImageTestEventHandler = (...args: any) => void;

export type ImageTestPropsFnInput = {
  range: (start: number, end: number) => number | Animated.AnimatedInterpolation<number> | string;
  event: (name: string) => ImageTestEventHandler;
};

export type ImageTestProps = any;

export type ImageTestPropsFn = (input: ImageTestPropsFnInput) => ImageTestProps;

export type ImageTestComponent =
  | React.ComponentType<ImageProps>
  | React.ComponentType<RNImageProps>;

export interface ImageTest {
  name: string;
  props: ImageTestProps | ImageTestPropsFn;
  loadOnDemand?: boolean;
  testInformation?: string;
}

export interface ImageTestGroup {
  name: string;
  tests: (ImageTest | ImageTestGroup)[];
  description?: string;
}
