import {
  always,
  block,
  call,
  clockRunning,
  cond,
  set,
  startClock,
  stopClock,
} from '../base';
import Clock from '../core/AnimatedClock';
import { evaluateOnce } from '../derived/evaluateOnce';

function createOldAnimationObject(node, animationStateDefaults, value, config) {
  const newClock = new Clock();
  const currentState = animationStateDefaults();
  let alwaysNode;
  let isStarted = false;
  let isDone = false;
  let wasStopped = false;
  let animationCallback;
  const animation = {
    start: currentAnimationCallback => {
      animationCallback = currentAnimationCallback;
      if (isStarted) {
        animationCallback && animationCallback({ finished: false });
        return;
      }
      if (isDone) {
        console.warn('Animation has been finished before');
        // inconsistent with React Native
        return;
      }

      if (!value.isNativelyInitialized()) {
        return;
      }

      isStarted = true;
      evaluateOnce(
        set(currentState.position, value),
        currentState.position,
        () => {
          alwaysNode = always(
            set(
              value,
              block([
                cond(clockRunning(newClock), 0, startClock(newClock)),
                node(newClock, currentState, config),
                cond(currentState.finished, [
                  call([], () => {
                    isStarted = false;
                    if (!wasStopped) {
                      isDone = true;
                    }
                    value.__detachAnimation(animation);
                    isDone = true;
                    if (!wasStopped) {
                      wasStopped = false;
                    }
                  }),
                  stopClock(newClock),
                ]),
                currentState.position,
              ])
            )
          );
          value.__attachAnimation(animation);
          alwaysNode.__addChild(value);
        }
      );
    },
    __detach: () => {
      animationCallback && animationCallback({ finished: isDone });
      animationCallback = null;
      value.__initialized && alwaysNode.__removeChild(value);
    },
    stop: () => {
      if (isDone) {
        console.warn(
          'Calling stop has no effect as the animation has already completed'
        );
        return;
      }
      if (!isStarted) {
        console.warn(
          "Calling stop has no effect as the animation hasn't been started"
        );
        return;
      }
      wasStopped = true;
      evaluateOnce(set(currentState.finished, 1), currentState.finished);
    },
    __stopImmediately_testOnly: result => {
      animation.stop();
      isDone = result;
      value.__detachAnimation(animation);
    },
  };
  return animation;
}

/**
 * Depending on the arguments list we either return animation node or return an
 * animation object that is compatible with the original Animated API
 */
export default function backwardsCompatibleAnimWrapper(
  node,
  animationStateDefaults
) {
  return (clock, state, config) => {
    if (config !== undefined) {
      return node(clock, state, config);
    }
    return createOldAnimationObject(node, animationStateDefaults, clock, state);
  };
}
