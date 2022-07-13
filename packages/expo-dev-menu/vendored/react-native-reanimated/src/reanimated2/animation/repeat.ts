import { defineAnimation } from './util';
import {
  Animation,
  AnimationCallback,
  AnimatableValue,
  Timestamp,
} from '../commonTypes';
import { NextAnimation, RepeatAnimation } from './commonTypes';

export interface InnerRepeatAnimation
  extends Omit<RepeatAnimation, 'toValue' | 'startValue'> {
  toValue: number;
  startValue: number;
}

export function withRepeat(
  _nextAnimation: NextAnimation<RepeatAnimation>,
  numberOfReps = 2,
  reverse = false,
  callback?: AnimationCallback
): Animation<RepeatAnimation> {
  'worklet';

  return defineAnimation<RepeatAnimation>(_nextAnimation, () => {
    'worklet';

    const nextAnimation: RepeatAnimation =
      typeof _nextAnimation === 'function' ? _nextAnimation() : _nextAnimation;

    function repeat(animation: InnerRepeatAnimation, now: Timestamp): boolean {
      const finished = nextAnimation.onFrame(nextAnimation, now);
      animation.current = nextAnimation.current;
      if (finished) {
        animation.reps += 1;
        // call inner animation's callback on every repetition
        // as the second argument the animation's current value is passed
        if (nextAnimation.callback) {
          nextAnimation.callback(true /* finished */, animation.current);
        }
        if (numberOfReps > 0 && animation.reps >= numberOfReps) {
          return true;
        }

        const startValue = reverse
          ? (nextAnimation.current as number)
          : animation.startValue;
        if (reverse) {
          nextAnimation.toValue = animation.startValue;
          animation.startValue = startValue;
        }
        nextAnimation.onStart(
          nextAnimation,
          startValue,
          now,
          nextAnimation.previousAnimation as RepeatAnimation
        );
        return false;
      }
      return false;
    }

    const repCallback = (finished: boolean): void => {
      if (callback) {
        callback(finished);
      }
      // when cancelled call inner animation's callback
      if (!finished && nextAnimation.callback) {
        nextAnimation.callback(false /* finished */);
      }
    };

    function onStart(
      animation: RepeatAnimation,
      value: AnimatableValue,
      now: Timestamp,
      previousAnimation: RepeatAnimation
    ): void {
      animation.startValue = value;
      animation.reps = 0;
      nextAnimation.onStart(nextAnimation, value, now, previousAnimation);
    }

    return {
      isHigherOrder: true,
      onFrame: repeat,
      onStart,
      reps: 0,
      current: nextAnimation.current,
      callback: repCallback,
      startValue: 0,
    } as RepeatAnimation;
  });
}

/**
 * @deprecated Kept for backward compatibility. Will be removed soon.
 */
export function repeat(
  _nextAnimation: NextAnimation<RepeatAnimation>,
  numberOfReps = 2,
  reverse = false,
  callback?: AnimationCallback
): Animation<RepeatAnimation> {
  'worklet';
  console.warn(
    'Method `repeat` is deprecated. Please use `withRepeat` instead'
  );
  return withRepeat(_nextAnimation, numberOfReps, reverse, callback);
}

export function loop(
  nextAnimation: NextAnimation<RepeatAnimation>,
  numberOfLoops = 1
): Animation<RepeatAnimation> {
  'worklet';
  console.warn('Method `loop` is deprecated. Please use `withRepeat` instead');
  return repeat(nextAnimation, Math.round(numberOfLoops * 2), true);
}
