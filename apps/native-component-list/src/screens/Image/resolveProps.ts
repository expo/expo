import { Animated } from 'react-native';

import { ImageTestProps, ImageTestEventHandler } from './types';

type LogCallback = (message: string) => void;

function round(num: number): number {
  return Math.round(num * 1000) / 1000;
}

function range(
  start: number,
  end: number,
  animValue?: Animated.Value,
  flatten?: boolean
): number | Animated.AnimatedInterpolation<number> | string {
  if (animValue) {
    if (flatten) {
      // @ts-ignore
      if (animValue.__isNative) {
        //return `(native: ${start}..${end})`;
        return '(native)';
      } else {
        // @ts-ignore
        const val = animValue.__getValue();
        return round((end - start) * val + start);
      }
    } else {
      return animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [start, end],
      });
    }
  } else {
    return round((end - start) * 0.5 + start);
  }
}

let firstTimeStamp: number = 0;

function event(name: string, logCallback?: LogCallback): ImageTestEventHandler {
  return (...args) => {
    try {
      const event = args[0];
      const { timeStamp, nativeEvent } = event;
      firstTimeStamp = firstTimeStamp || timeStamp;
      const msec = (timeStamp - firstTimeStamp) % 60000;
      const message = `${msec} ${name}: ${JSON.stringify(nativeEvent)}`;
      if (logCallback) logCallback(message);
    } catch (err) {
      const message = `${name}: ${err.message}`;
      if (logCallback) logCallback(message);
    }
  };
}

export function resolveProps(
  props: ImageTestProps,
  animValue?: Animated.Value,
  flatten?: boolean,
  logCallback?: LogCallback
): ImageTestProps {
  if (typeof props === 'function') {
    return props({
      range: (start: number, end: number) => range(start, end, animValue, flatten),
      event: (name: string) => event(name, logCallback),
    });
  } else {
    return props;
  }
}
