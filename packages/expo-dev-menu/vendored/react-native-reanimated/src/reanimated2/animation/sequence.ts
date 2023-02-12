import { defineAnimation } from './util';
import { NextAnimation, SequenceAnimation } from './commonTypes';
import {
  Animation,
  AnimatableValue,
  AnimationObject,
  Timestamp,
} from '../commonTypes';

export function withSequence(
  ..._animations: NextAnimation<AnimationObject>[]
): Animation<SequenceAnimation> {
  'worklet';
  return defineAnimation<SequenceAnimation>(
    _animations[0] as SequenceAnimation,
    () => {
      'worklet';
      const animations = _animations.map((a) => {
        const result = typeof a === 'function' ? a() : a;
        result.finished = false;
        return result;
      });
      const firstAnimation = animations[0];

      const callback = (finished: boolean): void => {
        if (finished) {
          // we want to call the callback after every single animation
          // not after all of them
          return;
        }
        // this is going to be called only if sequence has been cancelled
        animations.forEach((animation) => {
          if (typeof animation.callback === 'function' && !animation.finished) {
            animation.callback(finished);
          }
        });
      };

      function sequence(animation: SequenceAnimation, now: Timestamp): boolean {
        const currentAnim = animations[animation.animationIndex];
        const finished = currentAnim.onFrame(currentAnim, now);
        animation.current = currentAnim.current;
        if (finished) {
          // we want to call the callback after every single animation
          if (currentAnim.callback) {
            currentAnim.callback(true /* finished */);
          }
          currentAnim.finished = true;
          animation.animationIndex += 1;
          if (animation.animationIndex < animations.length) {
            const nextAnim = animations[animation.animationIndex];
            nextAnim.onStart(nextAnim, currentAnim.current, now, currentAnim);
            return false;
          }
          return true;
        }
        return false;
      }

      function onStart(
        animation: SequenceAnimation,
        value: AnimatableValue,
        now: Timestamp,
        previousAnimation: SequenceAnimation
      ): void {
        animation.animationIndex = 0;
        if (previousAnimation === undefined) {
          previousAnimation = animations[
            animations.length - 1
          ] as SequenceAnimation;
        }
        firstAnimation.onStart(firstAnimation, value, now, previousAnimation);
      }

      return {
        isHigherOrder: true,
        onFrame: sequence,
        onStart,
        animationIndex: 0,
        current: firstAnimation.current,
        callback,
      } as SequenceAnimation;
    }
  );
}

/**
 * @deprecated Kept for backward compatibility. Will be removed soon.
 */
export function sequence(
  ..._animations: NextAnimation<SequenceAnimation>[]
): Animation<SequenceAnimation> {
  'worklet';
  console.warn(
    'Method `sequence` is deprecated. Please use `withSequence` instead'
  );
  return withSequence(..._animations);
}
