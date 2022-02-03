/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/inputaccessory/InputAccessoryShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Descriptor for <InputAccessoryView> component.
 */
class InputAccessoryComponentDescriptor final
    : public ConcreteComponentDescriptor<InputAccessoryShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(UnsharedShadowNode shadowNode) const override {
    assert(std::dynamic_pointer_cast<InputAccessoryShadowNode>(shadowNode));
    auto concreteShadowNode =
        std::static_pointer_cast<InputAccessoryShadowNode>(shadowNode);

    assert(std::dynamic_pointer_cast<YogaLayoutableShadowNode>(
        concreteShadowNode));
    auto layoutableShadowNode =
        std::static_pointer_cast<YogaLayoutableShadowNode>(concreteShadowNode);

    auto state =
        std::static_pointer_cast<const InputAccessoryShadowNode::ConcreteState>(
            shadowNode->getState());
    auto stateData = state->getData();

    layoutableShadowNode->setSize(
        Size{stateData.viewportSize.width, stateData.viewportSize.height});
    layoutableShadowNode->setPositionType(ABI43_0_0YGPositionTypeAbsolute);

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
