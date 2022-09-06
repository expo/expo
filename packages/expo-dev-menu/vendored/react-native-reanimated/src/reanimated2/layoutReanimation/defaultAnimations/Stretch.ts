import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationFunction,
} from '../animationBuilder/commonTypes';
import { ComplexAnimationBuilder } from '../animationBuilder';

export class StretchInX
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): StretchInX {
    return new StretchInX();
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
          transform: [{ scaleX: delayFunction(delay, animation(1, config)) }],
        },
        initialValues: {
          transform: [{ scaleX: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class StretchInY
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): StretchInY {
    return new StretchInY();
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
          transform: [{ scaleY: delayFunction(delay, animation(1, config)) }],
        },
        initialValues: {
          transform: [{ scaleY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class StretchOutX
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): StretchOutX {
    return new StretchOutX();
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
          transform: [{ scaleX: delayFunction(delay, animation(0, config)) }],
        },
        initialValues: {
          transform: [{ scaleX: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class StretchOutY
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): StretchOutY {
    return new StretchOutY();
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
          transform: [{ scaleY: delayFunction(delay, animation(0, config)) }],
        },
        initialValues: {
          transform: [{ scaleY: 1 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}
