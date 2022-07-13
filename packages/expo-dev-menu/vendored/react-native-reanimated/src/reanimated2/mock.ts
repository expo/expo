/* eslint-disable node/no-callback-literal */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const NOOP = () => {
  // noop
};
const ID = (t) => t;
const IMMEDIATE_CB_INVOCATION = (cb: () => unknown) => cb();

const ReanimatedV2 = {
  useSharedValue: (v) => ({ value: v }),
  useDerivedValue: (a) => ({ value: a() }),
  useAnimatedScrollHandler: () => NOOP,
  useAnimatedGestureHandler: () => NOOP,
  useAnimatedStyle: IMMEDIATE_CB_INVOCATION,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedReaction: NOOP,
  useAnimatedProps: IMMEDIATE_CB_INVOCATION,

  withTiming: (toValue, _, cb) => {
    cb && cb(true);
    return toValue;
  },
  withSpring: (toValue, _, cb) => {
    cb && cb(true);
    return toValue;
  },
  withDecay: (_, cb) => {
    cb && cb(true);
    return 0;
  },
  withDelay: (_, animationValue) => {
    return animationValue;
  },
  withSequence: (..._animations) => {
    return 0;
  },
  withRepeat: (animation) => {
    return animation;
  },
  cancelAnimation: NOOP,
  measure: () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pageX: 0,
    pageY: 0,
  }),
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    poly: ID,
    sin: ID,
    circle: ID,
    exp: ID,
    elastic: ID,
    back: ID,
    bounce: ID,
    bezier: () => ({ factory: ID }),
    bezierFn: ID,
    in: ID,
    out: ID,
    inOut: ID,
  },
  Extrapolation: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity',
  },

  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
};

module.exports = {
  ...ReanimatedV2,
};
