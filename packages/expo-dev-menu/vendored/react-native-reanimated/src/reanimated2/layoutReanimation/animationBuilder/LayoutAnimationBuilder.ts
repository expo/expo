import { withDelay, withTiming, withSpring } from '../../animation';
import {
  AnimationFunction,
  ILayoutAnimationBuilder,
  LayoutAnimationFunction,
  BaseLayoutAnimationConfig,
  LayoutAnimationBuild,
} from './commonTypes';
import { EasingFn } from '../../Easing';

export class LayoutAnimationBuilder implements ILayoutAnimationBuilder {
  durationV?: number;
  easingV?: EasingFn;
  delayV?: number;
  type?: AnimationFunction;
  dampingV?: number;
  massV?: number;
  stiffnessV?: number;
  overshootClampingV?: number;
  restDisplacementThresholdV?: number;
  restSpeedThresholdV?: number;
  callbackV?: (finished: boolean) => void;

  static duration(durationMs: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.duration(durationMs);
  }

  duration(durationMs: number): LayoutAnimationBuilder {
    this.durationV = durationMs;
    return this;
  }

  static easing(easingFunction: EasingFn): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.easing(easingFunction);
  }

  easing(easingFunction: EasingFn): LayoutAnimationBuilder {
    this.easingV = easingFunction;
    return this;
  }

  static delay(durationMs: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.delay(durationMs);
  }

  delay(durationMs: number): LayoutAnimationBuilder {
    this.delayV = durationMs;
    return this;
  }

  static springify(): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.springify();
  }

  springify(): LayoutAnimationBuilder {
    this.type = withSpring as AnimationFunction;
    return this;
  }

  static damping(damping: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.damping(damping);
  }

  damping(damping: number): LayoutAnimationBuilder {
    this.dampingV = damping;
    return this;
  }

  static mass(mass: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.mass(mass);
  }

  mass(mass: number): LayoutAnimationBuilder {
    this.massV = mass;
    return this;
  }

  static stiffness(stiffness: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.stiffness(stiffness);
  }

  stiffness(stiffness: number): LayoutAnimationBuilder {
    this.stiffnessV = stiffness;
    return this;
  }

  static overshootClamping(overshootClamping: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.overshootClamping(overshootClamping);
  }

  overshootClamping(overshootClamping: number): LayoutAnimationBuilder {
    this.overshootClampingV = overshootClamping;
    return this;
  }

  static restDisplacementThreshold(
    restDisplacementThreshold: number
  ): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.restDisplacementThreshold(restDisplacementThreshold);
  }

  restDisplacementThreshold(
    restDisplacementThreshold: number
  ): LayoutAnimationBuilder {
    this.restDisplacementThresholdV = restDisplacementThreshold;
    return this;
  }

  static restSpeedThreshold(r: number): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.restSpeedThreshold(r);
  }

  restSpeedThreshold(restSpeedThreshold: number): LayoutAnimationBuilder {
    this.restSpeedThresholdV = restSpeedThreshold;
    return this;
  }

  static withCallback(
    callback: (finished: boolean) => void
  ): LayoutAnimationBuilder {
    const instance = new LayoutAnimationBuilder();
    return instance.withCallback(callback);
  }

  withCallback(callback: (finished: boolean) => void): LayoutAnimationBuilder {
    this.callbackV = callback;
    return this;
  }

  static build(): LayoutAnimationFunction {
    const instance = new LayoutAnimationBuilder();
    return instance.build();
  }

  build: LayoutAnimationBuild = () => {
    const duration = this.durationV;
    const easing = this.easingV;
    const delay = this.delayV;
    const type = this.type ? this.type : (withTiming as AnimationFunction);
    const damping = this.dampingV;
    const mass = this.massV;
    const stiffness = this.stiffnessV;
    const overshootClamping = this.overshootClampingV;
    const restDisplacementThreshold = this.restDisplacementThresholdV;
    const restSpeedThreshold = this.restSpeedThresholdV;
    const callback = this.callbackV;

    const delayFunction: AnimationFunction = delay
      ? withDelay
      : (_, animation: AnimationFunction) => {
          'worklet';
          return animation;
        };

    const animation = type;

    const config: BaseLayoutAnimationConfig = {};

    if (type === withTiming) {
      if (easing) {
        config.easing = easing;
      }
      if (duration) {
        config.duration = duration;
      }
    } else {
      if (damping) {
        config.damping = damping;
      }
      if (mass) {
        config.mass = mass;
      }
      if (stiffness) {
        config.stiffness = stiffness;
      }
      if (overshootClamping) {
        config.overshootClamping = overshootClamping;
      }
      if (restDisplacementThreshold) {
        config.restDisplacementThreshold = restDisplacementThreshold;
      }
      if (restSpeedThreshold) {
        config.restSpeedThreshold = restSpeedThreshold;
      }
    }

    return (values) => {
      'worklet';
      return {
        initialValues: {
          originX: values.boriginX,
          originY: values.boriginY,
          width: values.bwidth,
          height: values.bheight,
        },
        animations: {
          originX: delayFunction(delay, animation(values.originX, config)),
          originY: delayFunction(delay, animation(values.originY, config)),
          width: delayFunction(delay, animation(values.width, config)),
          height: delayFunction(delay, animation(values.height, config)),
        },
        callback: callback,
      };
    };
  };
}
export const Layout = LayoutAnimationBuilder;
