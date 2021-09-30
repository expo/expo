import { withDelay, withTiming, withSpring } from '../../animation';
import {
  EntryExitAnimationFunction,
  AnimationFunction,
  BaseBuilderAnimationConfig,
  EntryExitAnimationBuild,
  LayoutAnimationAndConfig,
} from './commonTypes';
import { EasingFn } from '../../Easing';
export class BaseAnimationBuilder {
  durationV?: number;
  easingV?: EasingFn;
  delayV?: number;
  rotateV?: string;
  type?: AnimationFunction;
  dampingV?: number;
  massV?: number;
  stiffnessV?: number;
  overshootClampingV?: number;
  restDisplacementThresholdV?: number;
  restSpeedThresholdV?: number;
  callbackV?: (finished: boolean) => void;

  static createInstance: () => BaseAnimationBuilder;
  build: EntryExitAnimationBuild = () => {
    throw Error('Unimplemented method in child class.');
  };

  static duration(durationMs: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.duration(durationMs);
  }

  duration(durationMs: number): BaseAnimationBuilder {
    this.durationV = durationMs;
    return this;
  }

  static easing(easingFunction: EasingFn): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.easing(easingFunction);
  }

  easing(easingFunction: EasingFn): BaseAnimationBuilder {
    this.easingV = easingFunction;
    return this;
  }

  static delay(delayMs: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.delay(delayMs);
  }

  delay(delayMs: number): BaseAnimationBuilder {
    this.delayV = delayMs;
    return this;
  }

  static rotate(degree: string): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.rotate(degree);
  }

  rotate(degree: string): BaseAnimationBuilder {
    this.rotateV = degree;
    return this;
  }

  static springify(): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.springify();
  }

  springify(): BaseAnimationBuilder {
    this.type = withSpring as AnimationFunction;
    return this;
  }

  static damping(damping: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.damping(damping);
  }

  damping(damping: number): BaseAnimationBuilder {
    this.dampingV = damping;
    return this;
  }

  static mass(mass: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.mass(mass);
  }

  mass(mass: number): BaseAnimationBuilder {
    this.massV = mass;
    return this;
  }

  static stiffness(stiffness: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.stiffness(stiffness);
  }

  stiffness(stiffness: number): BaseAnimationBuilder {
    this.stiffnessV = stiffness;
    return this;
  }

  static overshootClamping(overshootClamping: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.overshootClamping(overshootClamping);
  }

  overshootClamping(overshootClamping: number): BaseAnimationBuilder {
    this.overshootClampingV = overshootClamping;
    return this;
  }

  static restDisplacementThreshold(
    restDisplacementThreshold: number
  ): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.restDisplacementThreshold(restDisplacementThreshold);
  }

  restDisplacementThreshold(
    restDisplacementThreshold: number
  ): BaseAnimationBuilder {
    this.restDisplacementThresholdV = restDisplacementThreshold;
    return this;
  }

  static restSpeedThreshold(restSpeedThreshold: number): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.restSpeedThreshold(restSpeedThreshold);
  }

  restSpeedThreshold(restSpeedThreshold: number): BaseAnimationBuilder {
    this.restSpeedThresholdV = restSpeedThreshold;
    return this;
  }

  static withCallback(
    callback: (finished: boolean) => void
  ): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.withCallback(callback);
  }

  withCallback(callback: (finsihed: boolean) => void): BaseAnimationBuilder {
    this.callbackV = callback;
    return this;
  }

  static build(): EntryExitAnimationFunction {
    const instance = this.createInstance();
    return instance.build();
  }

  getDelayFunction(): AnimationFunction {
    const delay = this.delayV;
    return delay
      ? withDelay
      : (_, animation) => {
          'worklet';
          return animation;
        };
  }

  getAnimationAndConfig(): LayoutAnimationAndConfig {
    const duration = this.durationV;
    const easing = this.easingV;
    const rotate = this.rotateV;
    const type = this.type ? this.type : (withTiming as AnimationFunction);
    const damping = this.dampingV;
    const mass = this.massV;
    const stiffness = this.stiffnessV;
    const overshootClamping = this.overshootClampingV;
    const restDisplacementThreshold = this.restDisplacementThresholdV;
    const restSpeedThreshold = this.restSpeedThresholdV;

    const animation = type;

    const config: BaseBuilderAnimationConfig = {};

    if (type === withTiming) {
      if (easing) {
        config.easing = easing;
      }
      if (duration) {
        config.duration = duration;
      }
      if (rotate) {
        config.rotate = rotate;
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
      if (rotate) {
        config.rotate = rotate;
      }
    }
    return [animation, config];
  }
}
