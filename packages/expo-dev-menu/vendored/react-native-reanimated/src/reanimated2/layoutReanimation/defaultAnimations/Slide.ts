import {
  EntryAnimationsValues,
  ExitAnimationsValues,
  AnimationConfigFunction,
  IEntryAnimationBuilder,
  IExitAnimationBuilder,
} from '../animationBuilder/commonTypes';
import { ComplexAnimationBuilder } from '../animationBuilder';

export class SlideInRight
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): SlideInRight {
    return new SlideInRight();
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
          originX: delayFunction(
            delay,
            animation(values.targetOriginX, config)
          ),
        },
        initialValues: {
          originX: values.targetOriginX + values.windowWidth,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class SlideInLeft
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): SlideInLeft {
    return new SlideInLeft();
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
          originX: delayFunction(
            delay,
            animation(values.targetOriginX, config)
          ),
        },
        initialValues: {
          originX: values.targetOriginX - values.windowWidth,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class SlideOutRight
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): SlideOutRight {
    return new SlideOutRight();
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
          originX: delayFunction(
            delay,
            animation(
              Math.max(
                values.currentOriginX + values.windowWidth,
                values.windowWidth
              ),
              config
            )
          ),
        },
        initialValues: {
          originX: values.currentOriginX,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class SlideOutLeft
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): SlideOutLeft {
    return new SlideOutLeft();
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
          originX: delayFunction(
            delay,
            animation(
              Math.min(
                values.currentOriginX - values.windowWidth,
                -values.windowWidth
              ),
              config
            )
          ),
        },
        initialValues: {
          originX: values.currentOriginX,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class SlideInUp
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): SlideInUp {
    return new SlideInUp();
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
          originY: delayFunction(
            delay,
            animation(values.targetOriginY, config)
          ),
        },
        initialValues: {
          originY: -values.windowHeight,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class SlideInDown
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): SlideInDown {
    return new SlideInDown();
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
          originY: delayFunction(
            delay,
            animation(values.targetOriginY, config)
          ),
        },
        initialValues: {
          originY: values.targetOriginY + values.windowHeight,
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class SlideOutUp
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): SlideOutUp {
    return new SlideOutUp();
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
          originY: delayFunction(
            delay,
            animation(
              Math.min(
                values.currentOriginY - values.windowHeight,
                -values.windowHeight
              ),
              config
            )
          ),
        },
        initialValues: { originY: values.currentOriginY, ...initialValues },
        callback: callback,
      };
    };
  };
}

export class SlideOutDown
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): SlideOutDown {
    return new SlideOutDown();
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
          originY: delayFunction(
            delay,
            animation(
              Math.max(
                values.currentOriginY + values.windowHeight,
                values.windowHeight
              ),
              config
            )
          ),
        },
        initialValues: { originY: values.currentOriginY, ...initialValues },
        callback: callback,
      };
    };
  };
}
