//import ExpoImage from 'expo-image';
//import * as React from 'react';
import { Animated } from 'react-native';

//export type ImageProps = React.ComponentProps<typeof ExpoImage>;
export type ImageProps = any; // TODO

export type ImageTestEventHandler = (...args: any) => void;

export type ImageTestPropsFnInput = {
  range: (start: number, end: number) => number | Animated.AnimatedInterpolation<number> | string;
  event: (name: string) => ImageTestEventHandler;
};

export type ImageTestPropsFn = (input: ImageTestPropsFnInput) => ImageProps;

export type ImageTestProps = ImageProps | ImageTestPropsFn;

export interface ImageTest {
  name: string;
  props: ImageTestProps;
  loadOnDemand?: boolean;
  testInformation?: string;
}

export interface ImageTestGroup {
  name: string;
  tests: (ImageTest | ImageTestGroup)[];
  description?: string;
}

export type Links = {
  ImageTest: {
    onRefresh?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    test: ImageTest | ImageTestGroup;
    tests: (ImageTest | ImageTestGroup)[];
  };
  ImageTests: { tests: ImageTestGroup };
};
