import { Dimensions } from 'react-native';
import { ComplexAnimationBuilder } from '../animationBuilder';
import {
  EntryExitAnimationFunction,
  IEntryExitAnimationBuilder,
} from '../animationBuilder/commonTypes';

const { width } = Dimensions.get('window');

export class RollInLeft
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): RollInLeft {
    return new RollInLeft();
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
          transform: [
            { translateX: delayFunction(delay, animation(0), config) },
            { rotate: delayFunction(delay, animation('0deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: -width }, { rotate: '-180deg' }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RollInRight
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): RollInRight {
    return new RollInRight();
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
          transform: [
            { translateX: delayFunction(delay, animation(0, config)) },
            { rotate: delayFunction(delay, animation('0deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: width }, { rotate: '180deg' }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RollOutLeft
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): RollOutLeft {
    return new RollOutLeft();
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
          transform: [
            { translateX: delayFunction(delay, animation(-width, config)) },
            { rotate: delayFunction(delay, animation('-180deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { rotate: '0deg' }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}

export class RollOutRight
  extends ComplexAnimationBuilder
  implements IEntryExitAnimationBuilder
{
  static createInstance(): RollOutRight {
    return new RollOutRight();
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
          transform: [
            { translateX: delayFunction(delay, animation(width, config)) },
            { rotate: delayFunction(delay, animation('180deg', config)) },
          ],
        },
        initialValues: {
          transform: [{ translateX: 0 }, { rotate: '0deg' }],
          ...initialValues,
        },
        callback: callback,
      };
    };
  };
}
