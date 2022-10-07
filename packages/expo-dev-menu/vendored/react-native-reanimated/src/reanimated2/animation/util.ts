import {
  HigherOrderAnimation,
  NextAnimation,
  DelayAnimation,
  RepeatAnimation,
  SequenceAnimation,
  StyleLayoutAnimation,
} from './commonTypes';
/* global _WORKLET */
import { ParsedColorArray, convertToHSVA, isColor, toRGBA } from '../Colors';

import {
  AnimatedStyle,
  SharedValue,
  AnimatableValue,
  Animation,
  AnimationObject,
  Timestamp,
} from '../commonTypes';
import NativeReanimatedModule from '../NativeReanimated';

let IN_STYLE_UPDATER = false;

export type UserUpdater = () => AnimatedStyle;

export function initialUpdaterRun<T>(updater: () => T): T {
  IN_STYLE_UPDATER = true;
  const result = updater();
  IN_STYLE_UPDATER = false;
  return result;
}
interface RecognizedPrefixSuffix {
  prefix?: string;
  suffix?: string;
  strippedValue: number;
}

function recognizePrefixSuffix(value: string | number): RecognizedPrefixSuffix {
  'worklet';
  if (typeof value === 'string') {
    const match = value.match(
      /([A-Za-z]*)(-?\d*\.?\d*)([eE][-+]?[0-9]+)?([A-Za-z%]*)/
    );
    if (!match) {
      throw Error(
        "Couldn't parse animation value. Check if there isn't any typo."
      );
    }
    const prefix = match[1];
    const suffix = match[4];
    // number with scientific notation
    const number = match[2] + (match[3] ?? '');
    return { prefix, suffix, strippedValue: parseFloat(number) };
  } else {
    return { strippedValue: value };
  }
}

function decorateAnimation<T extends AnimationObject | StyleLayoutAnimation>(
  animation: T
): void {
  'worklet';
  if ((animation as HigherOrderAnimation).isHigherOrder) {
    return;
  }

  const baseOnStart = (animation as Animation<AnimationObject>).onStart;
  const baseOnFrame = (animation as Animation<AnimationObject>).onFrame;
  const animationCopy = Object.assign({}, animation);
  delete animationCopy.callback;

  const prefNumberSuffOnStart = (
    animation: Animation<AnimationObject>,
    value: string | number,
    timestamp: number,
    previousAnimation: Animation<AnimationObject>
  ) => {
    // recognize prefix, suffix, and updates stripped value on animation start
    const { prefix, suffix, strippedValue } = recognizePrefixSuffix(value);
    animation.__prefix = prefix;
    animation.__suffix = suffix;
    animation.strippedCurrent = strippedValue;
    const { strippedValue: strippedToValue } = recognizePrefixSuffix(
      animation.toValue as string | number
    );
    animation.current = strippedValue;
    animation.startValue = strippedValue;
    animation.toValue = strippedToValue;
    if (previousAnimation && previousAnimation !== animation) {
      const {
        prefix: paPrefix,
        suffix: paSuffix,
        strippedValue: paStrippedValue,
      } = recognizePrefixSuffix(previousAnimation.current as string | number);
      previousAnimation.current = paStrippedValue;
      previousAnimation.__prefix = paPrefix;
      previousAnimation.__suffix = paSuffix;
    }

    baseOnStart(animation, strippedValue, timestamp, previousAnimation);

    animation.current =
      (animation.__prefix ?? '') +
      animation.current +
      (animation.__suffix ?? '');

    if (previousAnimation && previousAnimation !== animation) {
      previousAnimation.current =
        (previousAnimation.__prefix ?? '') +
        previousAnimation.current +
        (previousAnimation.__suffix ?? '');
    }
  };
  const prefNumberSuffOnFrame = (
    animation: Animation<AnimationObject>,
    timestamp: number
  ) => {
    animation.current = animation.strippedCurrent;
    const res = baseOnFrame(animation, timestamp);
    animation.strippedCurrent = animation.current;
    animation.current =
      (animation.__prefix ?? '') +
      animation.current +
      (animation.__suffix ?? '');
    return res;
  };

  const tab = ['H', 'S', 'V', 'A'];
  const colorOnStart = (
    animation: Animation<AnimationObject>,
    value: string | number,
    timestamp: Timestamp,
    previousAnimation: Animation<AnimationObject>
  ): void => {
    let HSVAValue: ParsedColorArray;
    let HSVACurrent: ParsedColorArray;
    let HSVAToValue: ParsedColorArray;
    const res: Array<number> = [];
    if (isColor(value)) {
      HSVACurrent = convertToHSVA(animation.current);
      HSVAValue = convertToHSVA(value);
      if (animation.toValue) {
        HSVAToValue = convertToHSVA(animation.toValue);
      }
    }
    tab.forEach((i, index) => {
      animation[i] = Object.assign({}, animationCopy);
      animation[i].current = HSVACurrent[index];
      animation[i].toValue = HSVAToValue ? HSVAToValue[index] : undefined;
      animation[i].onStart(
        animation[i],
        HSVAValue[index],
        timestamp,
        previousAnimation ? previousAnimation[i] : undefined
      );
      res.push(animation[i].current);
    });

    animation.current = toRGBA(res as ParsedColorArray);
  };

  const colorOnFrame = (
    animation: Animation<AnimationObject>,
    timestamp: Timestamp
  ): boolean => {
    const HSVACurrent = convertToHSVA(animation.current);
    const res: Array<number> = [];
    let finished = true;
    tab.forEach((i, index) => {
      animation[i].current = HSVACurrent[index];
      // @ts-ignore: disable-next-line
      finished &= animation[i].onFrame(animation[i], timestamp);
      res.push(animation[i].current);
    });

    animation.current = toRGBA(res as ParsedColorArray);
    return finished;
  };

  const arrayOnStart = (
    animation: Animation<AnimationObject>,
    value: Array<number>,
    timestamp: Timestamp,
    previousAnimation: Animation<AnimationObject>
  ): void => {
    value.forEach((v, i) => {
      animation[i] = Object.assign({}, animationCopy);
      animation[i].current = v;
      animation[i].toValue = (animation.toValue as Array<number>)[i];
      animation[i].onStart(
        animation[i],
        v,
        timestamp,
        previousAnimation ? previousAnimation[i] : undefined
      );
    });

    animation.current = value;
  };

  const arrayOnFrame = (
    animation: Animation<AnimationObject>,
    timestamp: Timestamp
  ): boolean => {
    let finished = true;
    (animation.current as Array<number>).forEach((v, i) => {
      // @ts-ignore: disable-next-line
      finished &= animation[i].onFrame(animation[i], timestamp);
      (animation.current as Array<number>)[i] = animation[i].current;
    });

    return finished;
  };

  animation.onStart = (
    animation: Animation<AnimationObject>,
    value: number,
    timestamp: Timestamp,
    previousAnimation: Animation<AnimationObject>
  ) => {
    if (isColor(value)) {
      colorOnStart(animation, value, timestamp, previousAnimation);
      animation.onFrame = colorOnFrame;
      return;
    } else if (Array.isArray(value)) {
      arrayOnStart(animation, value, timestamp, previousAnimation);
      animation.onFrame = arrayOnFrame;
      return;
    } else if (typeof value === 'string') {
      prefNumberSuffOnStart(animation, value, timestamp, previousAnimation);
      animation.onFrame = prefNumberSuffOnFrame;
      return;
    }
    baseOnStart(animation, value, timestamp, previousAnimation);
  };
}

type AnimationToDecoration<T extends AnimationObject | StyleLayoutAnimation> =
  T extends StyleLayoutAnimation
    ? Record<string, unknown>
    : T extends DelayAnimation
    ? NextAnimation<DelayAnimation>
    : T extends RepeatAnimation
    ? NextAnimation<RepeatAnimation>
    : T extends SequenceAnimation
    ? NextAnimation<SequenceAnimation>
    : AnimatableValue | T;

export function defineAnimation<
  T extends AnimationObject | StyleLayoutAnimation
>(starting: AnimationToDecoration<T>, factory: () => T): T {
  'worklet';
  if (IN_STYLE_UPDATER) {
    return starting as T;
  }
  const create = () => {
    'worklet';
    const animation = factory();
    decorateAnimation<T>(animation);
    return animation;
  };

  if (_WORKLET || !NativeReanimatedModule.native) {
    return create();
  }
  // @ts-ignore: eslint-disable-line
  return create;
}

export function cancelAnimation<T>(sharedValue: SharedValue<T>): void {
  'worklet';
  // setting the current value cancels the animation if one is currently running
  sharedValue.value = sharedValue.value; // eslint-disable-line no-self-assign
}

// TODO it should work only if there was no animation before.
export function withStartValue(
  startValue: AnimatableValue,
  animation: NextAnimation<AnimationObject>
): Animation<AnimationObject> {
  'worklet';
  return defineAnimation(startValue, () => {
    'worklet';
    if (!_WORKLET && typeof animation === 'function') {
      animation = animation();
    }
    (animation as Animation<AnimationObject>).current = startValue;
    return animation as Animation<AnimationObject>;
  });
}
