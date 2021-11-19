import AnimatedNode from './AnimatedNode';

import deepEqual from 'lodash.isequal';

function sanitizeTransform(inputTransform) {
  const outputTransform = [];
  let hasAnimatedTransform = false;
  inputTransform.forEach((transform) => {
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode) {
        hasAnimatedTransform = true;
        outputTransform.push({
          property: key,
          nodeID: value.__nodeID,
        });
      } else {
        outputTransform.push({
          property: key,
          value,
        });
      }
    }
  });
  return hasAnimatedTransform ? outputTransform : undefined;
}

function extractAnimatedParentNodes(transform) {
  const parents = [];
  transform.forEach((transform) => {
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode) {
        parents.push(value);
      }
    }
  });
  return parents;
}

export function createOrReuseTransformNode(transform, oldNode) {
  const config = sanitizeTransform(transform);
  if (config === undefined) {
    return undefined;
  }
  if (oldNode && deepEqual(config, oldNode._config)) {
    return oldNode;
  }
  return new AnimatedTransform(transform, config);
}

class AnimatedTransform extends AnimatedNode {
  constructor(transform, config) {
    super(
      { type: 'transform', transform: config },
      extractAnimatedParentNodes(transform)
    );
    this._config = config;
    this._transform = transform;
  }

  toString() {
    return `AnimatedTransform, id: ${this.__nodeID}`;
  }

  __onEvaluate() {
    return this._transform.map((transform) => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          result[key] = value.__getValue();
        }
      }
      return result;
    });
  }
}
