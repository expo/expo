/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0debug/ABI48_0_0React_native_assert.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/safeareaview/SafeAreaViewShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Descriptor for <SafeAreaView> component.
 */
class SafeAreaViewComponentDescriptor final
    : public ConcreteComponentDescriptor<SafeAreaViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ABI48_0_0React_native_assert(
        std::dynamic_pointer_cast<SafeAreaViewShadowNode>(shadowNode));
    auto safeAreaViewShadowNode =
        std::static_pointer_cast<SafeAreaViewShadowNode>(shadowNode);

    ABI48_0_0React_native_assert(std::dynamic_pointer_cast<YogaLayoutableShadowNode>(
        safeAreaViewShadowNode));
    auto layoutableShadowNode =
        std::static_pointer_cast<YogaLayoutableShadowNode>(
            safeAreaViewShadowNode);

    auto state =
        std::static_pointer_cast<const SafeAreaViewShadowNode::ConcreteState>(
            shadowNode->getState());
    auto stateData = state->getData();

    layoutableShadowNode->setPadding(stateData.padding);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
