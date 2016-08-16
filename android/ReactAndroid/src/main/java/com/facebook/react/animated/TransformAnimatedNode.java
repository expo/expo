/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.uimanager.MatrixMathHelper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Native counterpart of transform animated node (see AnimatedTransform class in AnimatedImplementation.js)
 */
/* package */ class TransformAnimatedNode extends AnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final Map<String, Object> mPropMapping;

  TransformAnimatedNode(ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    ReadableMap transforms = config.getMap("animated");
    ReadableMapKeySetIterator iter = transforms.keySetIterator();
    mPropMapping = new HashMap<>();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      int nodeIndex = transforms.getInt(propKey);
      mPropMapping.put(propKey, nodeIndex);
    }
    ReadableMap statics = config.getMap("statics");
    iter = statics.keySetIterator();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      switch (statics.getType(propKey)) {
        case Number:
          mPropMapping.put(propKey, statics.getDouble(propKey));
          break;
        case String:
          mPropMapping.put(
            propKey,
            NativeAnimatedHelper.parseAngle(statics.getString(propKey)));
          break;
      }

    }
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
  }

  public void collectViewUpdates(JavaOnlyMap propsMap) {
    double[] matrix = MatrixMathHelper.createIdentity();

    // Convert each transform to a matrix and multiply them together.
    for (Map.Entry<String, Object> entry : mPropMapping.entrySet()) {
      Object entryValue = entry.getValue();
      String entryKey = entry.getKey();

      // Get the current value of the transform. Animated nodes will be an Integer
      // representing the node id and static values will be a Double.
      double transformValue = -1;
      if (entryValue instanceof Integer) {
        AnimatedNode node = mNativeAnimatedNodesManager.getNodeById((Integer) entryValue);
        if (node == null) {
          throw new IllegalArgumentException("Mapped style node does not exists");
        } else if (node instanceof ValueAnimatedNode) {
          transformValue = ((ValueAnimatedNode) node).mValue;
        } else {
          throw new IllegalArgumentException("Unsupported type of node used as a transform child " +
            "node " + node.getClass());
        }
      } else {
        transformValue = (double) entryValue;
      }

      // TODO: Optimise these matrix maths to avoid allocations for each transform.
      switch(entryKey) {
        case "scaleX":
          matrix = MatrixMathHelper.multiply(
            MatrixMathHelper.createScale3d(transformValue, 1, 1), matrix);
          break;
        case "scaleY":
          matrix = MatrixMathHelper.multiply(
            MatrixMathHelper.createScale3d(1, transformValue, 1), matrix);
          break;
        case "scale":
          matrix = MatrixMathHelper.multiply(
            MatrixMathHelper.createScale3d(transformValue, transformValue, 1), matrix);
          break;
        case "translateX":
          matrix = MatrixMathHelper.multiply(
            MatrixMathHelper.createTranslate3d(transformValue, 0, 0), matrix);
          break;
        case "translateY":
          matrix = MatrixMathHelper.multiply(
            MatrixMathHelper.createTranslate3d(0, transformValue, 0), matrix);
          break;
        case "rotate":
          matrix = MatrixMathHelper.multiply(
            MatrixMathHelper.createRotateZ(transformValue), matrix);
      }
    }

    // Box the double array to allow passing it as a JavaOnlyArray.
    ArrayList<Double> matrixList = new ArrayList<>(16);
    for (double ele : matrix) {
      matrixList.add(ele);
    }

    propsMap.putArray("transform", JavaOnlyArray.from(matrixList));
  }
}
