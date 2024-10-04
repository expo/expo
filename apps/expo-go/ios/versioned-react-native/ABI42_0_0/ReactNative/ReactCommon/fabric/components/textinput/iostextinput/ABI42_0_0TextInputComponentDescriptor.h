/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/components/iostextinput/TextInputShadowNode.h>
#include <ABI42_0_0React/core/ConcreteComponentDescriptor.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Descriptor for <TextInput> component.
 */
class TextInputComponentDescriptor final
    : public ConcreteComponentDescriptor<TextInputShadowNode> {
 public:
  TextInputComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<TextInputShadowNode>(parameters) {
    textLayoutManager_ =
        std::make_shared<TextLayoutManager const>(contextContainer_);
  }

 protected:
  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<TextInputShadowNode>(shadowNode));
    auto concreteShadowNode =
        std::static_pointer_cast<TextInputShadowNode>(shadowNode);

    concreteShadowNode->setTextLayoutManager(textLayoutManager_);
    concreteShadowNode->dirtyLayout();
    concreteShadowNode->enableMeasurement();
  }

 private:
  TextLayoutManager::Shared textLayoutManager_;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
