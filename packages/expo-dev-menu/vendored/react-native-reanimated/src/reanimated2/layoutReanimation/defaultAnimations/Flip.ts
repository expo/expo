import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationBuild,
} from '../animationBuilder/commonTypes';
import { BaseAnimationBuilder } from '../animationBuilder/BaseAnimationBuilder';

export class FlipInXUp
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipInXUp {
    return new FlipInXUp();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '90deg' },
            { translateY: -targetValues.height },
          ],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipInYLeft {
    return new FlipInYLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '-90deg' },
            { translateX: -targetValues.width },
          ],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipInXDown {
    return new FlipInXDown();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '-90deg' },
            { translateY: targetValues.height },
          ],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipInYRight {
    return new FlipInYRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '90deg' },
            { translateX: targetValues.width },
          ],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipInEasyX {
    return new FlipInEasyX();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateX: '90deg' }],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipInEasyY {
    return new FlipInEasyY();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateY: '90deg' }],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipOutXUp {
    return new FlipOutXUp();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '0deg' },
            { translateY: 0 },
          ],
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('90deg', config)) },
            {
              translateY: delayFunction(
                delay,
                animation(-targetValues.height, config)
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipOutYLeft {
    return new FlipOutYLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '0deg' },
            { translateX: 0 },
          ],
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('-90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(-targetValues.width, config)
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipOutXDown {
    return new FlipOutXDown();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateX: '0deg' },
            { translateY: 0 },
          ],
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateX: delayFunction(delay, animation('-90deg', config)) },
            {
              translateY: delayFunction(
                delay,
                animation(targetValues.height, config)
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipOutYRight {
    return new FlipOutYRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return (targetValues) => {
      'worklet';
      return {
        initialValues: {
          transform: [
            { perspective: 500 },
            { rotateY: '0deg' },
            { translateX: 0 },
          ],
        },
        animations: {
          transform: [
            { perspective: delayFunction(delay, animation(500, config)) },
            { rotateY: delayFunction(delay, animation('90deg', config)) },
            {
              translateX: delayFunction(
                delay,
                animation(targetValues.width, config)
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipOutEasyX {
    return new FlipOutEasyX();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateX: '0deg' }],
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
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): FlipOutEasyY {
    return new FlipOutEasyY();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        initialValues: {
          transform: [{ perspective: 500 }, { rotateY: '0deg' }],
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
