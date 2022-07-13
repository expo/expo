import { withSequence, withTiming } from '../../animation';
import {
  ILayoutAnimationBuilder,
  LayoutAnimationFunction,
} from '../animationBuilder/commonTypes';
import { BaseAnimationBuilder } from '../animationBuilder';

export class SequencedTransition
  extends BaseAnimationBuilder
  implements ILayoutAnimationBuilder
{
  reversed = false;

  static createInstance(): SequencedTransition {
    return new SequencedTransition();
  }

  static reverse(): SequencedTransition {
    const instance = SequencedTransition.createInstance();
    return instance.reverse();
  }

  reverse(): SequencedTransition {
    this.reversed = !this.reversed;
    return this;
  }

  build = (): LayoutAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const callback = this.callbackV;
    const delay = this.getDelay();
    const sequenceDuration = (this.durationV ?? 500) / 2;
    const config = { duration: sequenceDuration };
    const reverse = this.reversed;

    return (values) => {
      'worklet';
      return {
        initialValues: {
          originX: values.currentOriginX,
          originY: values.currentOriginY,
          width: values.currentWidth,
          height: values.currentHeight,
        },
        animations: {
          originX: delayFunction(
            delay,
            withSequence(
              withTiming(
                reverse ? values.currentOriginX : values.targetOriginX,
                config
              ),
              withTiming(values.targetOriginX, config)
            )
          ),
          originY: delayFunction(
            delay,
            withSequence(
              withTiming(
                reverse ? values.targetOriginY : values.currentOriginY,
                config
              ),
              withTiming(values.targetOriginY, config)
            )
          ),
          width: delayFunction(
            delay,
            withSequence(
              withTiming(
                reverse ? values.currentWidth : values.targetWidth,
                config
              ),
              withTiming(values.targetWidth, config)
            )
          ),
          height: delayFunction(
            delay,
            withSequence(
              withTiming(
                reverse ? values.targetHeight : values.currentHeight,
                config
              ),
              withTiming(values.targetHeight, config)
            )
          ),
        },
        callback: callback,
      };
    };
  };
}
