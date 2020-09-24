import AnimatedNode from './AnimatedNode';

import deepEqual from 'fbjs/lib/areEqual';

function sanitizeTransform(inputTransform) {
  const outputTransform = [];
  inputTransform.forEach(transform => {
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode) {
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
  return outputTransform;
}

function extractAnimatedParentNodes(transform) {
  const parents = [];
  transform.forEach(transform => {
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
    return this._transform.map(transform => {
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
