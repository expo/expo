import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationBuild,
} from '../animationBuilder/commonTypes';
import { BaseBounceAnimationBuilder } from '../animationBuilder/BaseBounceAnimationBuilder';
import { withSequence, withTiming } from '../../animation';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export class BounceIn
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceIn {
    return new BounceIn();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              scale: delayFunction(
                delay,
                withSequence(
                  withTiming(1.2, { duration: duration }),
                  withTiming(0.9, { duration: (duration * 100) / 250 }),
                  withTiming(1.1, { duration: (duration * 100) / 250 }),
                  withTiming(1, { duration: (duration * 100) / 250 })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ scale: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceInDown
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceInDown {
    return new BounceInDown();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                withSequence(
                  withTiming(-20, { duration: duration }),
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(0, { duration: (duration * 100) / 250 })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [
            {
              translateY: height,
            },
          ],
        },
        callback: callback,
      };
    };
  };
}

export class BounceInUp
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceInUp {
    return new BounceInUp();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                withSequence(
                  withTiming(20, { duration: duration }),
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(0, { duration: (duration * 100) / 250 })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateY: -height }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceInLeft
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceInLeft {
    return new BounceInLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateX: delayFunction(
                delay,
                withSequence(
                  withTiming(20, { duration: duration }),
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(0, { duration: (duration * 100) / 250 })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateX: -width }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceInRight
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceInRight {
    return new BounceInRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateX: delayFunction(
                delay,
                withSequence(
                  withTiming(-20, { duration: duration }),
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(0, { duration: (duration * 100) / 250 })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateX: width }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceOut
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceOut {
    return new BounceOut();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              scale: delayFunction(
                delay,
                withSequence(
                  withTiming(1.1, { duration: (duration * 100) / 250 }),
                  withTiming(0.9, { duration: (duration * 100) / 250 }),
                  withTiming(1.2, { duration: (duration * 100) / 250 }),
                  withTiming(0, { duration: duration })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ scale: 1 }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceOutDown
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceOutDown {
    return new BounceOutDown();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                withSequence(
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(-20, { duration: (duration * 100) / 250 }),
                  withTiming(height, {
                    duration: duration,
                  })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateY: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceOutUp
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceOutUp {
    return new BounceOutUp();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateY: delayFunction(
                delay,
                withSequence(
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(20, { duration: (duration * 100) / 250 }),
                  withTiming(-height, {
                    duration: duration,
                  })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateY: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceOutLeft
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceOutRight {
    return new BounceOutLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateX: delayFunction(
                delay,
                withSequence(
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(20, { duration: (duration * 100) / 250 }),
                  withTiming(-width, {
                    duration: duration,
                  })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class BounceOutRight
  extends BaseBounceAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): BounceOutRight {
    return new BounceOutRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const delay = this.delayV;
    const duration = this.durationV ? this.durationV : 250;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            {
              translateX: delayFunction(
                delay,
                withSequence(
                  withTiming(-10, { duration: (duration * 100) / 250 }),
                  withTiming(10, { duration: (duration * 100) / 250 }),
                  withTiming(-20, { duration: (duration * 100) / 250 }),
                  withTiming(width, {
                    duration: duration,
                  })
                )
              ),
            },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }],
        },
        callback: callback,
      };
    };
  };
}
