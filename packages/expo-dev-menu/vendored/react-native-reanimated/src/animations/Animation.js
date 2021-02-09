import AnimatedValue from '../core/InternalAnimatedValue';

class Animation {
  static springDefaultState() {
    return {
      position: new AnimatedValue(0),
      finished: new AnimatedValue(0),
      velocity: new AnimatedValue(0),
      time: new AnimatedValue(0),
    };
  }

  static decayDefaultState() {
    return {
      position: new AnimatedValue(0),
      finished: new AnimatedValue(0),
      velocity: new AnimatedValue(0),
      time: new AnimatedValue(0),
    };
  }

  static timingDefaultState() {
    return {
      position: new AnimatedValue(0),
      finished: new AnimatedValue(0),
      time: new AnimatedValue(0),
      frameTime: new AnimatedValue(0),
    };
  }
}

export default Animation;
