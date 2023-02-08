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

export class ZoomIn
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomIn {
    return new ZoomIn();
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
        animations: {
          transform: [{ scale: delayFunction(delay, animation(1, config)) }],
        },
        initialValues: {
          transform: [{ scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInRotate
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomInRotate {
    return new ZoomInRotate();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const rotate = this.rotateV ? this.rotateV : '0.3';
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            { scale: delayFunction(delay, animation(1, config)) },
            { rotate: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ scale: 0 }, { rotate: rotate }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInLeft
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomInLeft {
    return new ZoomInLeft();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateX: delayFunction(delay, animation(0, config)) },
            { scale: delayFunction(delay, animation(1, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: -values.windowWidth }, { scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInRight
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomInRight {
    return new ZoomInRight();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateX: delayFunction(delay, animation(0, config)) },
            { scale: delayFunction(delay, animation(1, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: values.windowWidth }, { scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInUp
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomInUp {
    return new ZoomInUp();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateY: delayFunction(delay, animation(0, config)) },
            { scale: delayFunction(delay, animation(1, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: -values.windowHeight }, { scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInDown
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomInDown {
    return new ZoomInDown();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateY: delayFunction(delay, animation(0, config)) },
            { scale: delayFunction(delay, animation(1, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: values.windowHeight }, { scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInEasyUp
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): ZoomInEasyUp {
    return new ZoomInEasyUp();
  }

  build = (): AnimationConfigFunction<EntryAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateY: delayFunction(delay, animation(0, config)) },
            { scale: delayFunction(delay, animation(1, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: -values.targetHeight }, { scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomInEasyDown
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): ZoomInEasyDown {
    return new ZoomInEasyDown();
  }

  build = (): AnimationConfigFunction<EntryAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateY: delayFunction(delay, animation(0, config)) },
            { scale: delayFunction(delay, animation(1, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: values.targetHeight }, { scale: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOut
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomOut {
    return new ZoomOut();
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
        animations: {
          transform: [{ scale: delayFunction(delay, animation(0, config)) }],
        },
        initialValues: {
          transform: [{ scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutRotate
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomOutRotate {
    return new ZoomOutRotate();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const rotate = this.rotateV ? this.rotateV : '0.3';
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            { scale: delayFunction(delay, animation(0, config)) },
            { rotate: delayFunction(delay, animation(rotate, config)) },
          ],
        },
        initialValues: {
          transform: [{ scale: 1 }, { rotate: '0' }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutLeft
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomOutLeft {
    return new ZoomOutLeft();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateX: delayFunction(
                delay,
                animation(-values.windowWidth, config)
              ),
            },
            { scale: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutRight
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomOutRight {
    return new ZoomOutRight();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateX: delayFunction(
                delay,
                animation(values.windowWidth, config)
              ),
            },
            { scale: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutUp
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomOutUp {
    return new ZoomOutUp();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                animation(-values.windowHeight, config)
              ),
            },
            { scale: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: 0 }, { scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutDown
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): ZoomOutDown {
    return new ZoomOutDown();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                animation(values.windowHeight, config)
              ),
            },
            { scale: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: 0 }, { scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutEasyUp
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): ZoomOutEasyUp {
    return new ZoomOutEasyUp();
  }

  build = (): AnimationConfigFunction<ExitAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                animation(-values.currentHeight, config)
              ),
            },
            { scale: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: 0 }, { scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class ZoomOutEasyDown
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): ZoomOutEasyDown {
    return new ZoomOutEasyDown();
  }

  build = (): AnimationConfigFunction<ExitAnimationsValues> => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.getDelay();
    const callback = this.callbackV;
    const initialValues = this.initialValues;

    return (values) => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                animation(values.currentHeight, config)
              ),
            },
            { scale: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          transform: [{ translateY: 0 }, { scale: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}
