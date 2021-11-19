import { findNodeHandle } from 'react-native';

import AnimatedNode from './AnimatedNode';
import AnimatedEvent from './AnimatedEvent';
import { createOrReuseStyleNode } from './AnimatedStyle';

import invariant from 'invariant';
import deepEqual from 'lodash.isequal';
import { val } from '../val';

function sanitizeProps(inputProps) {
  let props;
  for (const key in inputProps) {
    const value = inputProps[key];
    if (value instanceof AnimatedNode && !(value instanceof AnimatedEvent)) {
      if (props === undefined) {
        props = {};
      }
      props[key] = value.__nodeID;
    }
  }
  return props;
}

export function createOrReusePropsNode(props, callback, oldNode) {
  if (props.style) {
    const style = createOrReuseStyleNode(
      props.style,
      oldNode && oldNode._props.style
    );
    if (style) {
      props = {
        ...props,
        style,
      };
    }
  }
  const config = sanitizeProps(props);
  if (config === undefined) {
    return undefined;
  }
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

  toString() {
    return `AnimatedProps, id: ${this.__nodeID}`;
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

  __detach() {
    const nativeViewTag = findNodeHandle(this._animatedView);
    invariant(
      nativeViewTag != null,
      'Unable to locate attached view in the native tree'
    );
    this._disconnectAnimatedView(nativeViewTag);
    super.__detach();
  }

  update() {
    this._callback();

    if (!this._animatedView) {
      return;
    }

    val(this);
  }

  setNativeView(animatedView) {
    if (this._animatedView === animatedView) {
      return;
    }
    this._animatedView = animatedView;

    const nativeViewTag = findNodeHandle(this._animatedView);
    invariant(
      nativeViewTag != null,
      'Unable to locate attached view in the native tree'
    );
    this._connectAnimatedView(nativeViewTag);
  }
}
