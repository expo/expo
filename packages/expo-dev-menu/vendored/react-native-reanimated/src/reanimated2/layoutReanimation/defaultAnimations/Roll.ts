import { Dimensions } from 'react-native';
import { BaseAnimationBuilder } from '../animationBuilder/BaseAnimationBuilder';
import {
  EntryExitAnimationBuild,
  IEntryExitAnimationBuilder,
} from '../animationBuilder/commonTypes';

const { width } = Dimensions.get('window');

export class RollInLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RollInLeft {
    return new RollInLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateX: delayFunction(delay, animation(0), config) },
            { rotate: delayFunction(delay, animation('0deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: -width }, { rotate: '-180deg' }],
        },
        callback: callback,
      };
    };
  };
}

export class RollInRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RollInRight {
    return new RollInRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateX: delayFunction(delay, animation(0, config)) },
            { rotate: delayFunction(delay, animation('0deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: width }, { rotate: '180deg' }],
        },
        callback: callback,
      };
    };
  };
}

export class RollOutLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RollOutLeft {
    return new RollOutLeft();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateX: delayFunction(delay, animation(-width, config)) },
            { rotate: delayFunction(delay, animation('-180deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { rotate: '0deg' }],
        },
        callback: callback,
      };
    };
  };
}

export class RollOutRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): RollOutRight {
    return new RollOutRight();
  }

  build: EntryExitAnimationBuild = () => {
    const delayFunction = this.getDelayFunction();
    const [animation, config] = this.getAnimationAndConfig();
    const delay = this.delayV;
    const callback = this.callbackV;

    return () => {
      'worklet';
      return {
        animations: {
          transform: [
            { translateX: delayFunction(delay, animation(width, config)) },
            { rotate: delayFunction(delay, animation('180deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { rotate: '0deg' }],
        },
        callback: callback,
      };
    };
  };
}
