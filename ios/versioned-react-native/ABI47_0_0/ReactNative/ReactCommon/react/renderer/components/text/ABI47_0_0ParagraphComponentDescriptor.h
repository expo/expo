/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/text/ParagraphShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ConcreteComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/textlayoutmanager/TextLayoutManager.h>
#include <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final
    : public ConcreteComponentDescriptor<ParagraphShadowNode> {
 public:
  ParagraphComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<ParagraphShadowNode>(parameters) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer_);
  }

 protected:
  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto paragraphShadowNode =
        std::static_pointer_cast<ParagraphShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode->setTextLayoutManager(textLayoutManager_);
  }

 private:
  std::shared_ptr<TextLayoutManager const> textLayoutManager_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
