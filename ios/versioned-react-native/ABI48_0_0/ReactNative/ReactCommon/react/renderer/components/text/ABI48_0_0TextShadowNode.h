/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <ABI48_0_0React/ABI48_0_0renderer/components/text/BaseTextShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/TextProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewEventEmitter.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteShadowNode.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

extern const char TextComponentName[];

using TextEventEmitter = TouchEventEmitter;

class TextShadowNode : public ConcreteShadowNode<
                           TextComponentName,
                           ShadowNode,
                           TextProps,
                           TextEventEmitter>,
                       public BaseTextShadowNode {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteShadowNode::BaseTraits();

#ifdef ANDROID
    traits.set(ShadowNodeTraits::Trait::FormsView);
#endif
    traits.set(ShadowNodeTraits::Trait::Text);

    return traits;
  }

  using ConcreteShadowNode::ConcreteShadowNode;

#ifdef ANDROID
  using BaseShadowNode = ConcreteShadowNode<
      TextComponentName,
      ShadowNode,
      TextProps,
      TextEventEmitter>;

  TextShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, family, traits), BaseTextShadowNode() {
    orderIndex_ = std::numeric_limits<decltype(orderIndex_)>::max();
  }
#endif
};

template <>
inline TextShadowNode const &traitCast<TextShadowNode const &>(
    ShadowNode const &shadowNode) {
  bool castable = shadowNode.getTraits().check(ShadowNodeTraits::Trait::Text);
  ABI48_0_0React_native_assert(castable);
  (void)castable;
  return static_cast<TextShadowNode const &>(shadowNode);
}

template <>
inline TextShadowNode const *traitCast<TextShadowNode const *>(
    ShadowNode const *shadowNode) {
  if (!shadowNode) {
    return nullptr;
  }
  bool castable = shadowNode->getTraits().check(ShadowNodeTraits::Trait::Text);
  if (!castable) {
    return nullptr;
  }
  return static_cast<TextShadowNode const *>(shadowNode);
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
