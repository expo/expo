/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI38_0_0React/components/text/BaseTextShadowNode.h>
#include <ABI38_0_0React/components/text/TextProps.h>
#include <ABI38_0_0React/components/view/ViewEventEmitter.h>
#include <ABI38_0_0React/core/ConcreteShadowNode.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

extern const char TextComponentName[];

using TextEventEmitter = TouchEventEmitter;

class TextShadowNode
    : public ConcreteShadowNode<TextComponentName, TextProps, TextEventEmitter>,
      public BaseTextShadowNode {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
