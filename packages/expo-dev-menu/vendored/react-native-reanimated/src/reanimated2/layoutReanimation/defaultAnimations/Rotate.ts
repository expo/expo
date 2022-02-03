import { BaseAnimationBuilder } from '../animationBuilder/BaseAnimationBuilder';
import {
  EntryExitAnimationBuild,
  IEntryExitAnimationBuilder,
} from '../animationBuilder/commonTypes';

export class RotateInDownLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateInDownLeft {
    return new RotateInDownLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
            { translateX: values.width / 2 - values.height / 2 },
            { translateY: -(values.width / 2 - values.height / 2) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class RotateInDownRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateInDownRight {
    return new RotateInDownRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
            { translateX: -(values.width / 2 - values.height / 2) },
            { translateY: -(values.width / 2 - values.height / 2) },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class RotateInUpLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateInUpLeft {
    return new RotateInUpLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
            { translateX: values.width / 2 - values.height / 2 },
            { translateY: values.width / 2 - values.height / 2 },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class RotateInUpRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateInUpRight {
    return new RotateInUpRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
            { translateX: -(values.width / 2 - values.height / 2) },
            { translateY: values.width / 2 - values.height / 2 },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutDownLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateOutDownLeft {
    return new RotateOutDownLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
                animation(values.width / 2 - values.height / 2, config)
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(values.width / 2 - values.height / 2, config)
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutDownRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateOutDownRight {
    return new RotateOutDownRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
                animation(-(values.width / 2 - values.height / 2), config)
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(values.width / 2 - values.height / 2, config)
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutUpLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateOutUpLeft {
    return new RotateOutUpLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
                animation(values.width / 2 - values.height / 2, config)
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(-(values.width / 2 - values.height / 2), config)
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class RotateOutUpRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RotateOutUpRight {
    return new RotateOutUpRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

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
                animation(-(values.width / 2 - values.height / 2), config)
              ),
            },
            {
              translateY: delayFunction(
                delay,
                animation(-(values.width / 2 - values.height / 2), config)
              ),
            },
          ],
        },
        initialValues: {
          opacity: 1,
          transform: [{ rotate: '0deg' }, { translateX: 0 }, { translateY: 0 }],
        },
        callback: callback,
      };
    };
  };
}
