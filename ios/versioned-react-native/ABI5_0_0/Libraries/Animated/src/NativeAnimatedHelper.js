/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeAnimatedHelper
 * @flow
 */
'use strict';

var NativeAnimatedModule = require('NativeModules').NativeAnimatedModule;

var invariant = require('fbjs/lib/invariant');

var __nativeAnimatedNodeTagCount = 1; /* used for animated nodes */
var __nativeAnimationTagCount = 1; /* used for started animations */

type EndResult = {finished: bool};
type EndCallback = (result: EndResult) => void;

/**
 * Simple wrappers around NativeANimatedModule to provide flow and autocmplete support for
 * the native module methods
 */
var API = {
  createAnimatedNode: function(tag: number, config: Object): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.createAnimatedNode(tag, config);
  },
  connectAnimatedNodes: function(parentTag: number, childTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.connectAnimatedNodes(parentTag, childTag);
  },
  disconnectAnimatedNodes: function(parentTag: number, childTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.disconnectAnimatedNodes(parentTag, childTag);
  },
  startAnimatingNode: function(animationTag: number, nodeTag: number, config: Object, endCallback: EndCallback): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.startAnimatingNode(nodeTag, config, endCallback);
  },
  setAnimatedNodeValue: function(nodeTag: number, value: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.setAnimatedNodeValue(nodeTag, value);
  },
  connectAnimatedNodeToView: function(nodeTag: number, viewTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.connectAnimatedNodeToView(nodeTag, viewTag);
  },
  disconnectAnimatedNodeFromView: function(nodeTag: number, viewTag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.disconnectAnimatedNodeFromView(nodeTag, viewTag);
  },
  dropAnimatedNode: function(tag: number): void {
    assertNativeAnimatedModule();
    NativeAnimatedModule.dropAnimatedNode(tag);
  },
};

/**
 * Properties allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric property that doesn't need
 * to be updated through the shadow view hierarchy (all non-layout properties). This list is limited
 * to the properties that will perform best when animated off the JS thread.
 */
var PROPS_WHITELIST = {
  style: {
    opacity: true,
    transform: true,

    /* legacy android transform properties */
    scaleX: true,
    scaleY: true,
    rotation: true,
    translateX: true,
    translateY: true,
  },
};

function validateProps(params: Object): void {
  for (var key in params) {
    if (!PROPS_WHITELIST.hasOwnProperty(key)) {
      throw new Error(`Property '${key}' is not supported by native animated module`);
    }
  }
}

function validateStyles(styles: Object): void {
  var STYLES_WHITELIST = PROPS_WHITELIST.style || {};
  for (var key in styles) {
    if (!STYLES_WHITELIST.hasOwnProperty(key)) {
      throw new Error(`Style property '${key}' is not supported by native animated module`);
    }
  }
}

function validateTransform(transforms: Array<Object>, isAnimated: (p: any) => bool): void {
  var animated = {};
  var statics = {
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
  };
  var order = 0;
  var usedKeys = {};
  transforms.forEach(transform => {
    for (var key in transform) {
      var value = transform[key];
      var isValueAnimated = isAnimated(value);
      var output = isValueAnimated ? animated : statics;
      value = isValueAnimated ? value.__getNativeTag() : value;
      if (key in usedKeys) {
        throw new Error('Native animated transform doesn\'t support duplicated transform entries');
      }
      usedKeys[key] = 1;
      switch (key) {
        case 'translateX':
        case 'translateY':
          invariant(order == 0, 'Illegal native animated transform, translate should go first');
          output[key] = value;
          break;
        case 'translate':
          invariant(order == 0, 'Illegal native animated transform, translate should go first');
          order = 1;
          output['translateX'] = output['translateY'] = value;
          break;
        case 'rotate':
          invariant(order < 2, 'Illegal native animated transform, rotate should go after translate');
          order = 2;
          output[key] = value;
          break;
        case 'rotateX':
          invariant(order < 3, 'Illegal native animated transform, rotateX should go after translate and rotate');
          order = 3;
          output[key] = value;
          break;
        case 'rotateY':
          invariant(order < 4, 'Illegal native animated transform, rotateY should go after translate and rotateX');
          order = 4;
          output[key] = value;
          break;
        case 'scale':
          invariant(order < 5, 'Illegal native animated transform, scale should go after rotatations');
          order = 5;
          output['scaleX'] = output['scaleY'] = value;
          break;
        case 'scaleX':
        case 'scaleY':
          invariant(order < 6, 'Illegal native animated transform, scaleX/scaleY should go after rotatations');
          output[key] = value;
          break;
        default:
          throw new Error('Native animated transform doesn\'t support property; ' + key);
      }
    }
  });
  for (var key in animated) {
    delete statics[key];
  }
  return {
    animated: animated,
    statics: statics,
  };
}

function validateInterpolation(config: Object): void {
  var SUPPORTED_INTERPOLATION_PARAMS = {
    inputRange: true,
    outputRange: true,
  };
  for (var key in config) {
    if (!SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(key)) {
      throw new Error(`Interpolation property '${key}' is not supported by native animated module`);
    }
  }
}

function generateNewNodeTag(): number {
  return __nativeAnimatedNodeTagCount++;
}

function generateNewAnimationTag(): number {
  return __nativeAnimationTagCount++;
}

function assertNativeAnimatedModule(): void {
  invariant(NativeAnimatedModule, 'Native animated module is not available');
}

module.exports = {
  API,
  validateProps,
  validateStyles,
  validateTransform,
  validateInterpolation,
  generateNewNodeTag,
  generateNewAnimationTag,
  assertNativeAnimatedModule,
};
