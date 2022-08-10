import { ComplexAnimationBuilder } from '../animationBuilder/ComplexAnimationBuilder';
import {
  ILayoutAnimationBuilder,
  LayoutAnimationFunction,
} from '../animationBuilder/commonTypes';

export class LinearTransition
  extends ComplexAnimationBuilder
  implements ILayoutAnimationBuilder
{
  static createInstance(): LinearTransition {
    return new LinearTransition();
  }

  build = (): LayoutAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const delay = this.getDelay();

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
            animation(values.targetOriginX, config)
          ),
          originY: delayFunction(
            delay,
            animation(values.targetOriginY, config)
          ),
          width: delayFunction(delay, animation(values.targetWidth, config)),
          height: delayFunction(delay, animation(values.targetHeight, config)),
        },
        callback: callback,
      };
    };
  };
}

export const Layout = LinearTransition;
