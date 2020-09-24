import { StyleSheet } from 'react-native';

import AnimatedNode from './AnimatedNode';
import { createOrReuseTransformNode } from './AnimatedTransform';

import deepEqual from 'fbjs/lib/areEqual';

function sanitizeStyle(inputStyle) {
  const style = {};
  for (const key in inputStyle) {
    const value = inputStyle[key];
    if (value instanceof AnimatedNode) {
      style[key] = value.__nodeID;
    }
  }
  return style;
}

export function createOrReuseStyleNode(style, oldNode) {
  style = StyleSheet.flatten(style) || {};
  if (style.transform) {
    style = {
      ...style,
      transform: createOrReuseTransformNode(
        style.transform,
        oldNode && oldNode._style.transform
      ),
    };
  }
  const config = sanitizeStyle(style);
  if (oldNode && deepEqual(config, oldNode._config)) {
    return oldNode;
  }
  return new AnimatedStyle(style, config);
}

/**
 * AnimatedStyle should never be directly instantiated, use createOrReuseStyleNode
 * in order to make a new instance of this node.
 */
export default class AnimatedStyle extends AnimatedNode {
  constructor(style, config) {
    super({ type: 'style', style: config }, Object.values(style));
    this._config = config;
    this._style = style;
  }

  toString() {
    return `AnimatedStyle, id: ${this.__nodeID}`;
  }

  _walkStyleAndGetAnimatedValues(style) {
    const updatedStyle = {};
    for (const key in style) {
      const value = style[key];
      if (value instanceof AnimatedNode) {
        updatedStyle[key] = value.__getValue();
      } else if (value && !Array.isArray(value) && typeof value === 'object') {
        // Support animating nested values (for example: shadowOffset.height)
        updatedStyle[key] = this._walkStyleAndGetAnimatedValues(value);
      }
    }
    return updatedStyle;
  }

  __onEvaluate() {
    return this._walkStyleAndGetAnimatedValues(this._style);
  }
}
