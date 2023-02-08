import { defineAnimation } from './util';
import {
  Timestamp,
  AnimatableValue,
  AnimationObject,
  Animation,
  AnimatedStyle,
  NestedObject,
  NestedObjectValues,
} from '../commonTypes';
import { StyleLayoutAnimation } from './commonTypes';
import { withTiming } from './timing';
import { ColorProperties } from '../UpdateProps';
import { processColor } from '../Colors';

// resolves path to value for nested objects
// if path cannot be resolved returns undefined
export function resolvePath<T>(
  obj: NestedObject<T>,
  path: AnimatableValue[] | AnimatableValue
): NestedObjectValues<T> | undefined {
  'worklet';
  const keys: AnimatableValue[] = Array.isArray(path) ? path : [path];
  return keys.reduce<NestedObjectValues<T> | undefined>((acc, current) => {
    if (Array.isArray(acc) && typeof current === 'number') {
      return acc[current];
    } else if (typeof acc === 'object' && (current as number | string) in acc) {
      return (acc as { [key: string]: NestedObjectValues<T> })[
        current as number | string
      ];
    }
    return undefined;
  }, obj);
}

// set value at given path
type Path = Array<string | number> | string | number;
export function setPath<T>(
  obj: NestedObject<T>,
  path: Path,
  value: NestedObjectValues<T>
): void {
  'worklet';
  const keys: Path = Array.isArray(path) ? path : [path];
  let currObj: NestedObjectValues<T> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    // creates entry if there isn't one
    currObj = currObj as { [key: string]: NestedObjectValues<T> };
    if (!(keys[i] in currObj)) {
      // if next key is a number create an array
      if (typeof keys[i + 1] === 'number') {
        currObj[keys[i]] = [];
      } else {
        currObj[keys[i]] = {};
      }
    }
    currObj = currObj[keys[i]];
  }

  (currObj as { [key: string]: NestedObjectValues<T> })[keys[keys.length - 1]] =
    value;
}

interface NestedObjectEntry<T> {
  value: NestedObjectValues<T>;
  path: (string | number)[];
}

export function withStyleAnimation(
  styleAnimations: AnimatedStyle
): StyleLayoutAnimation {
  'worklet';
  return defineAnimation<StyleLayoutAnimation>({}, () => {
    'worklet';

    const onFrame = (
      animation: StyleLayoutAnimation,
      now: Timestamp
    ): boolean => {
      let stillGoing = false;
      const entriesToCheck: NestedObjectEntry<AnimationObject>[] = [
        { value: animation.styleAnimations, path: [] },
      ];
      while (entriesToCheck.length > 0) {
        const currentEntry: NestedObjectEntry<AnimationObject> =
          entriesToCheck.pop() as NestedObjectEntry<AnimationObject>;
        if (Array.isArray(currentEntry.value)) {
          for (let index = 0; index < currentEntry.value.length; index++) {
            entriesToCheck.push({
              value: currentEntry.value[index],
              path: currentEntry.path.concat(index),
            });
          }
        } else if (
          typeof currentEntry.value === 'object' &&
          currentEntry.value.onFrame === undefined
        ) {
          // nested object
          for (const key of Object.keys(currentEntry.value)) {
            entriesToCheck.push({
              value: currentEntry.value[key],
              path: currentEntry.path.concat(key),
            });
          }
        } else {
          const currentStyleAnimation: AnimationObject =
            currentEntry.value as AnimationObject;
          if (currentStyleAnimation.finished) {
            continue;
          }
          const finished = currentStyleAnimation.onFrame(
            currentStyleAnimation,
            now
          );
          if (finished) {
            currentStyleAnimation.finished = true;
            if (currentStyleAnimation.callback) {
              currentStyleAnimation.callback(true);
            }
          } else {
            stillGoing = true;
          }

          if (ColorProperties.includes(currentEntry.path[0] as string)) {
            currentStyleAnimation.current = processColor(
              currentStyleAnimation.current
            ) as number;
          }

          setPath(
            animation.current,
            currentEntry.path,
            currentStyleAnimation.current
          );
        }
      }
      return !stillGoing;
    };

    const onStart = (
      animation: StyleLayoutAnimation,
      value: AnimatedStyle,
      now: Timestamp,
      previousAnimation: StyleLayoutAnimation
    ): void => {
      const entriesToCheck: NestedObjectEntry<
        AnimationObject | AnimatableValue
      >[] = [{ value: styleAnimations, path: [] }];
      while (entriesToCheck.length > 0) {
        const currentEntry: NestedObjectEntry<
          AnimationObject | AnimatableValue
        > = entriesToCheck.pop() as NestedObjectEntry<
          AnimationObject | AnimatableValue
        >;
        if (Array.isArray(currentEntry.value)) {
          for (let index = 0; index < currentEntry.value.length; index++) {
            entriesToCheck.push({
              value: currentEntry.value[index],
              path: currentEntry.path.concat(index),
            });
          }
        } else if (
          typeof currentEntry.value === 'object' &&
          currentEntry.value.onStart === undefined
        ) {
          for (const key of Object.keys(currentEntry.value)) {
            entriesToCheck.push({
              value: currentEntry.value[key],
              path: currentEntry.path.concat(key),
            });
          }
        } else {
          const prevAnimation = resolvePath(
            previousAnimation?.styleAnimations,
            currentEntry.path
          );
          let prevVal = resolvePath(value, currentEntry.path);
          if (prevAnimation && !prevVal) {
            prevVal = prevAnimation.current;
          }
          if (prevVal === undefined) {
            console.warn(
              `Initial values for animation are missing for property ${currentEntry.path.join(
                '.'
              )}`
            );
          }
          setPath(animation.current, currentEntry.path, prevVal);
          let currentAnimation: AnimationObject;
          if (
            typeof currentEntry.value !== 'object' ||
            !currentEntry.value.onStart
          ) {
            currentAnimation = withTiming(
              currentEntry.value as AnimatableValue,
              { duration: 0 }
            );
            setPath(
              animation.styleAnimations,
              currentEntry.path,
              currentAnimation
            );
          } else {
            currentAnimation = currentEntry.value as Animation<AnimationObject>;
          }
          currentAnimation.onStart(
            currentAnimation,
            prevVal,
            now,
            prevAnimation
          );
        }
      }
    };

    const callback = (finished: boolean): void => {
      if (!finished) {
        const animationsToCheck: NestedObjectValues<AnimationObject>[] = [
          styleAnimations,
        ];
        while (animationsToCheck.length > 0) {
          const currentAnimation: NestedObjectValues<AnimationObject> =
            animationsToCheck.pop() as NestedObjectValues<AnimationObject>;
          if (Array.isArray(currentAnimation)) {
            for (const element of currentAnimation) {
              animationsToCheck.push(element);
            }
          } else if (
            typeof currentAnimation === 'object' &&
            currentAnimation.onStart === undefined
          ) {
            for (const value of Object.values(currentAnimation)) {
              animationsToCheck.push(value);
            }
          } else {
            const currentStyleAnimation: AnimationObject =
              currentAnimation as AnimationObject;
            if (
              !currentStyleAnimation.finished &&
              currentStyleAnimation.callback
            ) {
              currentStyleAnimation.callback(false);
            }
          }
        }
      }
    };

    return {
      isHigherOrder: true,
      onFrame,
      onStart,
      current: {},
      styleAnimations,
      callback,
    } as StyleLayoutAnimation;
  });
}
