/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <ABI42_0_0React/components/modal/ModalHostViewShadowNode.h>
#include <ABI42_0_0React/core/ConcreteComponentDescriptor.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Descriptor for <BottomSheet> component.
 */

class ModalHostViewComponentDescriptor final
    : public ConcreteComponentDescriptor<ModalHostViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<ModalHostViewShadowNode>(shadowNode));
    auto modalShadowNode =
        std::static_pointer_cast<ModalHostViewShadowNode>(shadowNode);

    assert(
        std::dynamic_pointer_cast<YogaLayoutableShadowNode>(modalShadowNode));
    auto layoutableShadowNode =
        std::static_pointer_cast<YogaLayoutableShadowNode>(modalShadowNode);

    auto state =
        std::static_pointer_cast<const ModalHostViewShadowNode::ConcreteState>(
            shadowNode->getState());
    auto stateData = state->getData();

    layoutableShadowNode->setSize(
        Size{stateData.screenSize.width, stateData.screenSize.height});
    layoutableShadowNode->setPositionType(ABI42_0_0YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
