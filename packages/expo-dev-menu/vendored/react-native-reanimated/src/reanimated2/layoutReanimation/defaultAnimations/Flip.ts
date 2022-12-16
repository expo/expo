import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationFunction,
  EntryAnimationsValues,
  ExitAnimationsValues,
  AnimationConfigFunction,
  IEntryAnimationBuilder,
  IExitAnimationBuilder,
} from '../animationBuilder/commonTypes';
import { ComplexAnimationBuilder } from '../animationBuilder';

export class FlipInXUp
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): FlipInXUp {
    return new FlipInXUp();
  }

  build = (): AnimationConfigFunction<EntryAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '90deg' },
            { translateY: -targetValues.targetHeight },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: 500 },
            { rotateX: delayFunction(delay, animation('0deg', config)) },
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipInYLeft
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): FlipInYLeft {
    return new FlipInYLeft();
  }

  build = (): AnimationConfigFunction<EntryAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '-90deg' },
            { translateX: -targetValues.targetWidth },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('0deg', config)) },
            { translateX: delayFunction(delay, animation(0, config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipInXDown
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): FlipInXDown {
    return new FlipInXDown();
  }

  build = (): AnimationConfigFunction<EntryAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '-90deg' },
            { translateY: targetValues.targetHeight },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('0deg', config)) },
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipInYRight
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): FlipInYRight {
    return new FlipInYRight();
  }

  build = (): AnimationConfigFunction<EntryAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '90deg' },
            { translateX: targetValues.targetWidth },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('0deg', config)) },
            { translateX: delayFunction(delay, animation(0, config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipInEasyX
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FlipInEasyX {
    return new FlipInEasyX();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateX: '90deg' }],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('0deg', config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipInEasyY
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FlipInEasyY {
    return new FlipInEasyY();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateY: '90deg' }],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('0deg', config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipOutXUp
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): FlipOutXUp {
    return new FlipOutXUp();
  }

  build = (): AnimationConfigFunction<ExitAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '0deg' },
            { translateY: 0 },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('90deg', config)) },
            {
              translateY: delayFunction(
                delay,
                animation(-targetValues.currentHeight, config)
              ),
            },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipOutYLeft
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): FlipOutYLeft {
    return new FlipOutYLeft();
  }

  build = (): AnimationConfigFunction<ExitAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '0deg' },
            { translateX: 0 },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('-90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(-targetValues.currentWidth, config)
              ),
            },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipOutXDown
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): FlipOutXDown {
    return new FlipOutXDown();
  }

  build = (): AnimationConfigFunction<ExitAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '0deg' },
            { translateY: 0 },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('-90deg', config)) },
            {
              translateY: delayFunction(
                delay,
                animation(targetValues.currentHeight, config)
              ),
            },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipOutYRight
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): FlipOutYRight {
    return new FlipOutYRight();
  }

  build = (): AnimationConfigFunction<ExitAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '0deg' },
            { translateX: 0 },
          ],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(targetValues.currentWidth, config)
              ),
            },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipOutEasyX
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FlipOutEasyX {
    return new FlipOutEasyX();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateX: '0deg' }],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('90deg', config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class FlipOutEasyY
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FlipOutEasyY {
    return new FlipOutEasyY();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateY: '0deg' }],
          ...initialValues,
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('90deg', config)) },
          ],
        },
        callback: callback,
      };
    };
  };
}
