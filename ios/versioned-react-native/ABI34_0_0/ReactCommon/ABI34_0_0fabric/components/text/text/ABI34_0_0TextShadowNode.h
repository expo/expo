/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/text/BaseTextShadowNode.h>
#include <ReactABI34_0_0/components/text/TextProps.h>
#include <ReactABI34_0_0/components/view/ViewEventEmitter.h>
#include <ReactABI34_0_0/core/ConcreteShadowNode.h>

namespace facebook {
namespace ReactABI34_0_0 {

extern const char TextComponentName[];

using TextEventEmitter = TouchEventEmitter;

class TextShadowNode
    : public ConcreteShadowNode<TextComponentName, TextProps, TextEventEmitter>,
      public BaseTextShadowNode {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace ReactABI34_0_0
} // namespace facebook
