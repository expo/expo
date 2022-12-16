import {
  ILayoutAnimationBuilder,
  LayoutAnimationFunction,
} from '../animationBuilder/commonTypes';
import { BaseAnimationBuilder } from '../animationBuilder';
import { EasingFn, Easing } from '../../Easing';
import { withTiming } from '../../animation';

export class CurvedTransition
  extends BaseAnimationBuilder
  implements ILayoutAnimationBuilder
{
  easingXV: EasingFn = Easing.in(Easing.ease);
  easingYV: EasingFn = Easing.out(Easing.ease);
  easingWidthV: EasingFn = Easing.in(Easing.exp);
  easingHeightV: EasingFn = Easing.out(Easing.exp);
  static createInstance(): CurvedTransition {
    return new CurvedTransition();
  }

  static easingX(easing: EasingFn): CurvedTransition {
    const instance = this.createInstance();
    return instance.easingX(easing);
  }

  easingX(easing: EasingFn): CurvedTransition {
    this.easingXV = easing;
    return this;
  }

  static easingY(easing: EasingFn): CurvedTransition {
    const instance = this.createInstance();
    return instance.easingY(easing);
  }

  easingY(easing: EasingFn): CurvedTransition {
    this.easingYV = easing;
    return this;
  }

  static easingWidth(easing: EasingFn): CurvedTransition {
    const instance = this.createInstance();
    return instance.easingWidth(easing);
  }

  easingWidth(easing: EasingFn): CurvedTransition {
    this.easingWidthV = easing;
    return this;
  }

  static easingHeight(easing: EasingFn): CurvedTransition {
    const instance = this.createInstance();
    return instance.easingHeight(easing);
  }

  easingHeight(easing: EasingFn): CurvedTransition {
    this.easingHeightV = easing;
    return this;
  }

  build = (): LayoutAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const callback = this.callbackV;
    const delay = this.getDelay();
    const duration = this.durationV ?? 300;
    const easing = {
      easingX: this.easingXV,
      easingY: this.easingYV,
      easingWidth: this.easingWidthV,
      easingHeight: this.easingHeightV,
    };

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
            withTiming(values.targetOriginX, {
              duration,
              easing: easing.easingX,
            })
          ),
          originY: delayFunction(
            delay,
            withTiming(values.targetOriginY, {
              duration,
              easing: easing.easingY,
            })
          ),
          width: delayFunction(
            delay,
            withTiming(values.targetWidth, {
              duration,
              easing: easing.easingWidth,
            })
          ),
          height: delayFunction(
            delay,
            withTiming(values.targetHeight, {
              duration,
              easing: easing.easingHeight,
            })
          ),
        },
        callback: callback,
      };
    };
  };
}
