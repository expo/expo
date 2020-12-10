import Animated, { Easing } from './Animated';
import ReanimatedModule from './ReanimatedModule';
import React from 'react';

import renderer from 'react-test-renderer';

jest.mock('./ReanimatedEventEmitter');
jest.mock('./ReanimatedModule');
jest.mock('./derived/evaluateOnce');
jest.mock('./core/AnimatedProps');

const { Value, timing, spring, decay } = Animated;
describe('Reanimated backward compatible API', () => {
  beforeEach(() => {
    let numberOfNodes = 0;
    ReanimatedModule.createNode = () => numberOfNodes++;
    ReanimatedModule.dropNode = () => numberOfNodes--;
    ReanimatedModule.getNumberOfNodes = () => numberOfNodes;
  });

  const checkIfNodesGetDetachedCorrectly = animation => {
    class TestComponent extends React.Component {
      constructor(props) {
        super(props);
        this.transX = new Value(0);
        this.anim = animation.node(this.transX, animation.config);
      }

      start(method) {
        this.anim.start(method);
      }

      stop(res) {
        this.anim.__stopImmediately_testOnly(res);
      }

      render() {
        return (
          <Animated.View style={{ transform: [{ translateX: this.transX }] }} />
        );
      }
    }
    const ref = React.createRef();
    let result;
    const resMethod = ({ finished }) => (result = finished);
    const initial = ReanimatedModule.getNumberOfNodes();
    const wrapper = renderer.create(<TestComponent ref={ref} />);
    const before = ReanimatedModule.getNumberOfNodes();
    ref.current.start(resMethod);
    const during = ReanimatedModule.getNumberOfNodes();
    ref.current.stop(true);
    const after = ReanimatedModule.getNumberOfNodes();
    wrapper.unmount();
    const final = ReanimatedModule.getNumberOfNodes();

    return (
      result &&
      initial === final &&
      after === before &&
      during > after &&
      initial === 0 &&
      before === 4
    );
  };

  it('fails if timing does not attach nodes correctly', () => {
    expect(
      checkIfNodesGetDetachedCorrectly({
        node: timing,
        name: 'timing',
        config: {
          duration: 5000,
          toValue: 120,
          easing: Easing.inOut(Easing.ease),
        },
      })
    ).toBeTruthy();
  });

  it('fails if decay does not attach nodes correctly', () => {
    expect(
      checkIfNodesGetDetachedCorrectly({
        node: decay,
        name: 'decay',
        config: {
          deceleration: 0.997,
        },
      })
    ).toBeTruthy();
  });

  it('fails if spring does not attach nodes correctly', () => {
    expect(
      checkIfNodesGetDetachedCorrectly({
        node: spring,
        name: 'spring',
        config: {
          toValue: 0,
          damping: 7,
          mass: 1,
          stiffness: 121.6,
          overshootClamping: false,
          restSpeedThreshold: 0.001,
          restDisplacementThreshold: 0.001,
        },
      })
    ).toBeTruthy();
  });

  it('fails if animation related nodes are still attached after detaching of value with two animations triggered', () => {
    const { timing, Value } = Animated;
    class TestComponent extends React.Component {
      constructor(props) {
        super(props);
        this.transX = new Value(0);
        const config = {
          duration: 5000,
          toValue: -120,
          easing: Easing.inOut(Easing.ease),
        };
        this.anim = timing(this.transX, config);
        this.anim2 = timing(this.transX, config);
      }

      start1(method) {
        this.anim.start(method);
      }

      start2(method) {
        this.anim2.start(method);
      }

      render() {
        return (
          <Animated.View style={{ transform: [{ translateX: this.transX }] }} />
        );
      }
    }
    const ref = React.createRef();
    const wrapper = renderer.create(<TestComponent ref={ref} />);
    let result = true;
    const resMethod = ({ finished }) => (result = finished);
    ref.current.start1(resMethod);
    ref.current.start2(resMethod);
    expect(result).toBeFalsy();
    result = true;
    const numberOfNodesBeforeUnmounting = ReanimatedModule.getNumberOfNodes();
    wrapper.unmount();
    expect(result).toBeFalsy();
    const numberOfNodesAfterUnmounting = ReanimatedModule.getNumberOfNodes();
    const pass =
      numberOfNodesAfterUnmounting === 0 && numberOfNodesBeforeUnmounting > 0;
    expect(pass).toBeTruthy();
  });

  it('fails if animation related nodes are detached if there are two children and only one detach', () => {
    const { timing, Value } = Animated;
    const transX = new Value(0);
    const wrapper1 = renderer.create(
      <Animated.View
        style={{
          transform: [{ translateX: transX }],
        }}
      />
    );
    const wrapper2 = renderer.create(
      <Animated.View
        style={{
          transform: [{ translateX: transX }],
        }}
      />
    );
    const config = {
      duration: 5000,
      toValue: -120,
      easing: Easing.inOut(Easing.ease),
    };
    const anim = timing(transX, config);
    anim.start();
    const numberOfNodesBeforeDetach = ReanimatedModule.getNumberOfNodes();
    wrapper1.unmount();
    const numberOfNodesAfterDetach = ReanimatedModule.getNumberOfNodes();
    const result =
      // 3 means AnimatedProps, AnimatedStyle and AnimatedTransform
      // which are nodes not related to animation and has to be detached
      numberOfNodesBeforeDetach - 3 === numberOfNodesAfterDetach &&
      numberOfNodesAfterDetach > 3;
    expect(result).toBeTruthy();
    wrapper2.unmount();
    expect(ReanimatedModule.getNumberOfNodes() === 0).toBeTruthy();
  });

  it('fails if animation attaches some node without view related', () => {
    const { timing, Value } = Animated;
    const transX = new Value(0);

    const config = {
      duration: 5000,
      toValue: -120,
      easing: Easing.inOut(Easing.ease),
    };
    const anim = timing(transX, config);
    anim.start();
    expect(ReanimatedModule.getNumberOfNodes()).toBe(0);
  });
});
