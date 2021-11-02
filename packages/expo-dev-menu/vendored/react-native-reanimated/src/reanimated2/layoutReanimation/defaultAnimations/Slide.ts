import {
  IEntryExitAnimationBuilder,
  EntryExitAnimationBuild,
} from '../animationBuilder/commonTypes';
import { BaseAnimationBuilder } from '../animationBuilder/BaseAnimationBuilder';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export class SlideInRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideInRight {
    return new SlideInRight();
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
          originX: delayFunction(delay, animation(values.originX, config)),
        },
        initialValues: {
          originX: values.originX + width,
        },
        callback: callback,
      };
    };
  };
}

export class SlideInLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideInLeft {
    return new SlideInLeft();
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
          originX: delayFunction(delay, animation(values.originX, config)),
        },
        initialValues: {
          originX: values.originX - width,
        },
        callback: callback,
      };
    };
  };
}

export class SlideOutRight
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideOutRight {
    return new SlideOutRight();
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
          originX: delayFunction(
            delay,
            animation(Math.max(values.originX + width, width), config)
          ),
        },
        initialValues: {
          originX: values.originX,
        },
        callback: callback,
      };
    };
  };
}

export class SlideOutLeft
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideOutLeft {
    return new SlideOutLeft();
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
          originX: delayFunction(
            delay,
            animation(Math.min(values.originX - width, -width), config)
          ),
        },
        initialValues: {
          originX: values.originX,
        },
        callback: callback,
      };
    };
  };
}

export class SlideInUp
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideInUp {
    return new SlideInUp();
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
          originY: delayFunction(delay, animation(values.originY, config)),
        },
        initialValues: {
          originY: height,
        },
        callback: callback,
      };
    };
  };
}

export class SlideInDown
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideInDown {
    return new SlideInDown();
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
          originY: delayFunction(delay, animation(values.originY, config)),
        },
        initialValues: {
          originY: values.originY - height,
        },
        callback: callback,
      };
    };
  };
}

export class SlideOutUp
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideOutUp {
    return new SlideOutUp();
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
          originY: delayFunction(
            delay,
            animation(Math.min(values.originY - height, -height), config)
          ),
        },
        initialValues: { originY: values.originY },
        callback: callback,
      };
    };
  };
}

export class SlideOutDown
  extends BaseAnimationBuilder
  implements IEntryExitAnimationBuilder {
  static createInstance(): SlideOutDown {
    return new SlideOutDown();
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
          originY: delayFunction(
            delay,
            animation(Math.max(values.originY + height, height), config)
          ),
        },
        initialValues: { originY: values.originY },
        callback: callback,
      };
    };
  };
}
