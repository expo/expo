/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/components/safeareaview/SafeAreaViewShadowNode.h>
#include <ABI42_0_0React/core/ConcreteComponentDescriptor.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Descriptor for <SafeAreaView> component.
 */
class SafeAreaViewComponentDescriptor final
    : public ConcreteComponentDescriptor<SafeAreaViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<SafeAreaViewShadowNode>(shadowNode));
    auto safeAreaViewShadowNode =
        std::static_pointer_cast<SafeAreaViewShadowNode>(shadowNode);

    assert(std::dynamic_pointer_cast<YogaLayoutableShadowNode>(
        safeAreaViewShadowNode));
    auto layoutableShadowNode =
        std::static_pointer_cast<YogaLayoutableShadowNode>(
            safeAreaViewShadowNode);

    auto state =
        std::static_pointer_cast<const SafeAreaViewShadowNode::ConcreteState>(
            shadowNode->getState());
    auto stateData = state->getData();

    if (safeAreaViewShadowNode->alreadyAppliedPadding != stateData.padding) {
      safeAreaViewShadowNode->alreadyAppliedPadding = stateData.padding;
      layoutableShadowNode->setPadding(stateData.padding);
    }

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
