/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/modal/ModalHostViewShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Descriptor for <ModalHostView> component.
 */

class ModalHostViewComponentDescriptor final
    : public ConcreteComponentDescriptor<ModalHostViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    auto modalShadowNode =
        std::static_pointer_cast<ModalHostViewShadowNode>(shadowNode);

    auto layoutableShadowNode =
        std::static_pointer_cast<YogaLayoutableShadowNode>(modalShadowNode);

    auto state =
        std::static_pointer_cast<const ModalHostViewShadowNode::ConcreteState>(
            shadowNode->getState());
    auto stateData = state->getData();

    layoutableShadowNode->setSize(
        Size{stateData.screenSize.width, stateData.screenSize.height});
    layoutableShadowNode->setPositionType(ABI48_0_0YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
