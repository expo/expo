import {
  ILayoutAnimationBuilder,
  LayoutAnimationsValues,
  LayoutAnimationFunction,
} from '../animationBuilder/commonTypes';
import { BaseAnimationBuilder } from '../animationBuilder';
import { withSequence, withTiming } from '../../animation';
import { FadeIn, FadeOut } from '../defaultAnimations/Fade';
import {
  StyleProps,
  TransformProperty,
  AnimationObject,
} from '../../commonTypes';

export class EntryExitTransition
  extends BaseAnimationBuilder
  implements ILayoutAnimationBuilder
{
  enteringV: BaseAnimationBuilder | typeof BaseAnimationBuilder = FadeIn;

  exitingV: BaseAnimationBuilder | typeof BaseAnimationBuilder = FadeOut;

  static createInstance(): EntryExitTransition {
    return new EntryExitTransition();
  }

  static entering(
    animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
  ): EntryExitTransition {
    const instance = this.createInstance();
    return instance.entering(animation);
  }

  entering(
    animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
  ): EntryExitTransition {
    this.enteringV = animation;
    return this;
  }

  static exiting(
    animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
  ): EntryExitTransition {
    const instance = this.createInstance();
    return instance.exiting(animation);
  }

  exiting(
    animation: BaseAnimationBuilder | typeof BaseAnimationBuilder
  ): EntryExitTransition {
    this.exitingV = animation;
    return this;
  }

  build = (): LayoutAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const callback = this.callbackV;
    const delay = this.getDelay();
    const enteringAnimation = this.enteringV.build();
    const exitingAnimation = this.exitingV.build();
    const exitingDuration = this.exitingV.getDuration();

    return (values) => {
      'worklet';
      const enteringValues = enteringAnimation(values);
      const exitingValues = exitingAnimation(values);
      const animations: StyleProps = {
        transform: [],
      };

      for (const prop of Object.keys(exitingValues.animations)) {
        if (prop === 'transform') {
          exitingValues.animations[prop]?.forEach((value, index) => {
            for (const transformProp of Object.keys(value)) {
              animations.transform?.push({
                [transformProp]: delayFunction(
                  delay,
                  withSequence(
                    value[transformProp as keyof TransformProperty],
                    withTiming(
                      exitingValues.initialValues.transform
                        ? exitingValues.initialValues.transform[index][
                            transformProp as keyof TransformProperty
                          ]
                        : 0,
                      { duration: 0 }
                    )
                  )
                ),
              } as TransformProperty);
            }
          });
        } else {
          const sequence =
            enteringValues.animations[prop] !== undefined
              ? [
                  exitingValues.animations[prop],
                  withTiming(enteringValues.initialValues[prop], {
                    duration: 0,
                  }),
                  enteringValues.animations[prop],
                ]
              : [
                  exitingValues.animations[prop],
                  withTiming(
                    Object.keys(values).includes(prop)
                      ? values[prop as keyof LayoutAnimationsValues]
                      : exitingValues.initialValues[prop],
                    { duration: 0 }
                  ),
                ];

          animations[prop] = delayFunction(delay, withSequence(...sequence));
        }
      }
      for (const prop of Object.keys(enteringValues.animations)) {
        if (prop === 'transform') {
          enteringValues.animations[prop]?.forEach((value, index) => {
            for (const transformProp of Object.keys(value)) {
              animations.transform?.push({
                [transformProp]: delayFunction(
                  delay + exitingDuration,
                  withSequence(
                    withTiming(
                      enteringValues.initialValues.transform
                        ? enteringValues.initialValues.transform[index][
                            transformProp as keyof TransformProperty
                          ]
                        : 0,
                      { duration: exitingDuration }
                    ),
                    value[transformProp as keyof TransformProperty]
                  )
                ),
              } as TransformProperty);
            }
          });
        } else if (animations[prop] !== undefined) {
          // it was already added in the previous loop
          continue;
        } else {
          animations[prop] = delayFunction(
            delay,
            withSequence(
              withTiming(enteringValues.initialValues[prop], { duration: 0 }),
              enteringValues.animations[prop]
            )
          );
        }
      }

      const mergedTransform = (
        exitingValues.initialValues.transform ?? []
      ).concat(
        (enteringValues.animations.transform ?? []).map((value) => {
          const objectKeys = Object.keys(value);
          if (objectKeys?.length < 1) {
            console.error(
              `[Reanimated]: \${value} is not a valid Transform object`
            );
            return value;
          }
          const transformProp = objectKeys[0];
          const current = (
            value[transformProp as keyof TransformProperty] as AnimationObject
          ).current;
          if (typeof current === 'string') {
            if (current.includes('deg'))
              return {
                [transformProp]: '0deg',
              } as unknown as TransformProperty;
            else
              return {
                [transformProp]: '0',
              } as unknown as TransformProperty;
          } else if (transformProp.includes('translate')) {
            return { [transformProp]: 0 } as unknown as TransformProperty;
          } else {
            return { [transformProp]: 1 } as unknown as TransformProperty;
          }
          return value;
        })
      );

      return {
        initialValues: {
          ...exitingValues.initialValues,
          originX: values.currentOriginX,
          originY: values.currentOriginY,
          width: values.currentWidth,
          height: values.currentHeight,
          transform: mergedTransform,
        },
        animations: {
          originX: delayFunction(
            delay + exitingDuration,
            withTiming(values.targetOriginX, { duration: exitingDuration })
          ),
          originY: delayFunction(
            delay + exitingDuration,
            withTiming(values.targetOriginY, { duration: exitingDuration })
          ),
          width: delayFunction(
            delay + exitingDuration,
            withTiming(values.targetWidth, { duration: exitingDuration })
          ),
          height: delayFunction(
            delay + exitingDuration,
            withTiming(values.targetHeight, { duration: exitingDuration })
          ),
          ...animations,
        },
        callback: callback,
      };
    };
  };
}

export function combineTransition(
  exiting: BaseAnimationBuilder | typeof BaseAnimationBuilder,
  entering: BaseAnimationBuilder | typeof BaseAnimationBuilder
): EntryExitTransition {
  return EntryExitTransition.entering(entering).exiting(exiting);
}
