import { withTiming, withSpring } from '../../animation';
import {
  AnimationFunction,
  BaseBuilderAnimationConfig,
  LayoutAnimationAndConfig,
} from './commonTypes';
import { EasingFn } from '../../Easing';
import { BaseAnimationBuilder } from './BaseAnimationBuilder';
import { StyleProps } from '../../commonTypes';

export class ComplexAnimationBuilder extends BaseAnimationBuilder {
  easingV?: EasingFn;
  rotateV?: string;
  type?: AnimationFunction;
  dampingV?: number;
  massV?: number;
  stiffnessV?: number;
  overshootClampingV?: number;
  restDisplacementThresholdV?: number;
  restSpeedThresholdV?: number;
  initialValues?: StyleProps;

  static createInstance: () => ComplexAnimationBuilder;

  static easing(easingFunction: EasingFn): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.easing(easingFunction);
  }

  easing(easingFunction: EasingFn): ComplexAnimationBuilder {
    this.easingV = easingFunction;
    return this;
  }

  static rotate(degree: string): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.rotate(degree);
  }

  rotate(degree: string): ComplexAnimationBuilder {
    this.rotateV = degree;
    return this;
  }

  static springify(): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.springify();
  }

  springify(): ComplexAnimationBuilder {
    this.type = withSpring as AnimationFunction;
    return this;
  }

  static damping(damping: number): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.damping(damping);
  }

  damping(damping: number): ComplexAnimationBuilder {
    this.dampingV = damping;
    return this;
  }

  static mass(mass: number): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.mass(mass);
  }

  mass(mass: number): ComplexAnimationBuilder {
    this.massV = mass;
    return this;
  }

  static stiffness(stiffness: number): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.stiffness(stiffness);
  }

  stiffness(stiffness: number): ComplexAnimationBuilder {
    this.stiffnessV = stiffness;
    return this;
  }

  static overshootClamping(overshootClamping: number): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.overshootClamping(overshootClamping);
  }

  overshootClamping(overshootClamping: number): ComplexAnimationBuilder {
    this.overshootClampingV = overshootClamping;
    return this;
  }

  static restDisplacementThreshold(
    restDisplacementThreshold: number
  ): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.restDisplacementThreshold(restDisplacementThreshold);
  }

  restDisplacementThreshold(
    restDisplacementThreshold: number
  ): ComplexAnimationBuilder {
    this.restDisplacementThresholdV = restDisplacementThreshold;
    return this;
  }

  static restSpeedThreshold(
    restSpeedThreshold: number
  ): ComplexAnimationBuilder {
    const instance = this.createInstance();
    return instance.restSpeedThreshold(restSpeedThreshold);
  }

  restSpeedThreshold(restSpeedThreshold: number): ComplexAnimationBuilder {
    this.restSpeedThresholdV = restSpeedThreshold;
    return this;
  }

  static withInitialValues(values: StyleProps): BaseAnimationBuilder {
    const instance = this.createInstance();
    return instance.withInitialValues(values);
  }

  withInitialValues(values: StyleProps): BaseAnimationBuilder {
    this.initialValues = values;
    return this;
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
