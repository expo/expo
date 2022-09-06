import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationFunction,
} from '../animationBuilder/commonTypes';
import { ComplexAnimationBuilder } from '../animationBuilder';

export class FadeIn
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeIn {
    return new FadeIn();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return (_) => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(1, config)),
        },
        initialValues: {
          opacity: 0,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeInRight
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeInRight {
    return new FadeInRight();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { translateX: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [{ translateX: 25 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeInLeft
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeInLeft {
    return new FadeInLeft();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { translateX: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [{ translateX: -25 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeInUp
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeInUp {
    return new FadeInUp();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [{ translateY: -25 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeInDown
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeInDown {
    return new FadeInDown();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [{ translateY: 25 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeOut
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeOut {
    return new FadeOut();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return (_) => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(0, config)),
        },
        initialValues: {
          opacity: 1,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeOutRight
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeOutRight {
    return new FadeOutRight();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { translateX: delayFunction(delay, animation(25, config)) },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ translateX: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeOutLeft
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeOutLeft {
    return new FadeOutLeft();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { translateX: delayFunction(delay, animation(-25, config)) },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ translateX: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeOutUp
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeOutUp {
    return new FadeOutUp();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { translateY: delayFunction(delay, animation(-25, config)) },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ translateY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class FadeOutDown
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): FadeOutDown {
    return new FadeOutDown();
  }

  build = (): EntryExitAnimationFunction => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const callback = this.callbackV;
    const initialValues = this.initialValues;
    const delay = this.getDelay();

    return () => {
      'worklet';
      return {
        animations: {
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { translateY: delayFunction(delay, animation(25, config)) },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ translateY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}
