import AnimatedNode from '../AnimatedNode';
import AnimatedEvent from '../AnimatedEvent';
import AnimatedStyle, { createOrReuseStyleNode } from '../AnimatedStyle';

import deepEqual from 'lodash.isequal';

// This file has been mocked as react-native's `findNodeHandle` is returning undefined value;
// and I became easier to mock whole this file instead of mocking RN

function sanitizeProps(inputProps) {
  const props = {};
  for (const key in inputProps) {
    const value = inputProps[key];
    if (value instanceof AnimatedNode && !(value instanceof AnimatedEvent)) {
      props[key] = value.__nodeID;
    }
  }
  return props;
}

export function createOrReusePropsNode(props, callback, oldNode) {
  if (props.style) {
    props = {
      ...props,
      style: createOrReuseStyleNode(
        props.style,
        oldNode && oldNode._props.style
      ),
    };
  }
  const config = sanitizeProps(props);
  if (oldNode && deepEqual(config, oldNode._config)) {
    return oldNode;
  }
  return new AnimatedProps(props, config, callback);
}

class AnimatedProps extends AnimatedNode {
  constructor(props, config, callback) {
    super(
      { type: 'props', props: config },
      Object.values(props).filter((n) => !(n instanceof AnimatedEvent))
    );
    this._config = config;
    this._props = props;
    this._callback = callback;
    this.__attach();
  }

  __getProps() {
    const props = {};
    for (const key in this._props) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        if (value instanceof AnimatedStyle) {
          props[key] = value.__getProps();
        }
      } else {
        props[key] = value;
      }
    }
    return props;
  }

  __onEvaluate() {
    const props = {};
    for (const key in this._props) {
      const value = this._props[key];
      if (value instanceof AnimatedNode) {
        props[key] = value.__getValue();
      }
    }
    return props;
  }

  update() {
    this._callback();
  }

  setNativeView(animatedView) {
    if (this._animatedView === animatedView) {
      return;
    }
    this._animatedView = animatedView;
  }
}
