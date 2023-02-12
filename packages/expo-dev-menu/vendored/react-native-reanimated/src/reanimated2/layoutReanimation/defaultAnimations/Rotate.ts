import { ComplexAnimationBuilder } from '../animationBuilder';
import {
  EntryAnimationsValues,
  ExitAnimationsValues,
  AnimationConfigFunction,
  IEntryAnimationBuilder,
  IExitAnimationBuilder,
} from '../animationBuilder/commonTypes';

export class RotateInDownLeft
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): RotateInDownLeft {
    return new RotateInDownLeft();
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
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { rotate: delayFunction(delay, animation('0deg', config)) },
            { translateX: delayFunction(delay, animation(0, config)) },
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [
            { rotate: '-90deg' },
            { translateX: values.targetWidth / 2 - values.targetHeight / 2 },
            { translateY: -(values.targetWidth / 2 - values.targetHeight / 2) },
          ],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateInDownRight
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): RotateInDownRight {
    return new RotateInDownRight();
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
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { rotate: delayFunction(delay, animation('0deg', config)) },
            { translateX: delayFunction(delay, animation(0, config)) },
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [
            { rotate: '90deg' },
            { translateX: -(values.targetWidth / 2 - values.targetHeight / 2) },
            { translateY: -(values.targetWidth / 2 - values.targetHeight / 2) },
          ],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateInUpLeft
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): RotateInUpLeft {
    return new RotateInUpLeft();
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
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { rotate: delayFunction(delay, animation('0deg', config)) },
            { translateX: delayFunction(delay, animation(0, config)) },
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [
            { rotate: '90deg' },
            { translateX: values.targetWidth / 2 - values.targetHeight / 2 },
            { translateY: values.targetWidth / 2 - values.targetHeight / 2 },
          ],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateInUpRight
  extends ComplexAnimationBuilder
  implements IEntryAnimationBuilder
{
  static createInstance(): RotateInUpRight {
    return new RotateInUpRight();
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
          opacity: delayFunction(delay, animation(1, config)),
          transform: [
            { rotate: delayFunction(delay, animation('0deg', config)) },
            { translateX: delayFunction(delay, animation(0, config)) },
            { translateY: delayFunction(delay, animation(0, config)) },
          ],
        },
        initialValues: {
          opacity: 0,
          transform: [
            { rotate: '-90deg' },
            { translateX: -(values.targetWidth / 2 - values.targetHeight / 2) },
            { translateY: values.targetWidth / 2 - values.targetHeight / 2 },
          ],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutDownLeft
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): RotateOutDownLeft {
    return new RotateOutDownLeft();
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
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { rotate: delayFunction(delay, animation('90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(
                  values.currentWidth / 2 - values.currentHeight / 2,
                  config
                )
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(
                  values.currentWidth / 2 - values.currentHeight / 2,
                  config
                )
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutDownRight
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): RotateOutDownRight {
    return new RotateOutDownRight();
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
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { rotate: delayFunction(delay, animation('-90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(
                  -(values.currentWidth / 2 - values.currentHeight / 2),
                  config
                )
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(
                  values.currentWidth / 2 - values.currentHeight / 2,
                  config
                )
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutUpLeft
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): RotateOutUpLeft {
    return new RotateOutUpLeft();
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
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { rotate: delayFunction(delay, animation('-90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(
                  values.currentWidth / 2 - values.currentHeight / 2,
                  config
                )
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(
                  -(values.currentWidth / 2 - values.currentHeight / 2),
                  config
                )
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutUpRight
  extends ComplexAnimationBuilder
  implements IExitAnimationBuilder
{
  static createInstance(): RotateOutUpRight {
    return new RotateOutUpRight();
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
          opacity: delayFunction(delay, animation(0, config)),
          transform: [
            { rotate: delayFunction(delay, animation('90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(
                  -(values.currentWidth / 2 - values.currentHeight / 2),
                  config
                )
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(
                  -(values.currentWidth / 2 - values.currentHeight / 2),
                  config
                )
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}
