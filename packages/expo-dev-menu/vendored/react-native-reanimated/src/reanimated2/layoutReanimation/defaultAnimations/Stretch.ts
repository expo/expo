import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationBuild,
} from '../animationBuilder/commonTypes';
import { BaseAnimationBuilder } from '../animationBuilder/BaseAnimationBuilder';

export class StretchInX
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): StretchInX {
    return new StretchInX();
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
          transform: [{ scaleX: delayFunction(delay, animation(1, config)) }],
        },
        initialValues: {
          transform: [{ scaleX: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class StretchInY
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): StretchInY {
    return new StretchInY();
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
          transform: [{ scaleY: delayFunction(delay, animation(1, config)) }],
        },
        initialValues: {
          transform: [{ scaleY: 0 }],
        },
        callback: callback,
      };
    };
  };
}

export class StretchOutX
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): StretchOutX {
    return new StretchOutX();
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
          transform: [{ scaleX: delayFunction(delay, animation(0, config)) }],
        },
        initialValues: {
          transform: [{ scaleX: 1 }],
        },
        callback: callback,
      };
    };
  };
}

export class StretchOutY
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): StretchOutY {
    return new StretchOutY();
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
          transform: [{ scaleY: delayFunction(delay, animation(0, config)) }],
        },
        initialValues: {
          transform: [{ scaleY: 1 }],
        },
        callback: callback,
      };
    };
  };
}
