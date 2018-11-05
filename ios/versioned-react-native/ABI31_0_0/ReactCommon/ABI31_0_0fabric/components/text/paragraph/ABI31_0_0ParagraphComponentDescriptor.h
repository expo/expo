/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/text/ParagraphShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ConcreteComponentDescriptor.h>
#include <ABI31_0_0fabric/ABI31_0_0textlayoutmanager/TextLayoutManager.h>

namespace facebook {
namespace ReactABI31_0_0 {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final:
  public ConcreteComponentDescriptor<ParagraphShadowNode> {

public:

  ParagraphComponentDescriptor(SharedEventDispatcher eventDispatcher):
    ConcreteComponentDescriptor<ParagraphShadowNode>(eventDispatcher) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>();
  }

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ParagraphShadowNode>(shadowNode));
    auto paragraphShadowNode = std::static_pointer_cast<ParagraphShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode->setTextLayoutManager(textLayoutManager_);

    // All `ParagraphShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    paragraphShadowNode->enableMeasurement();
  }

private:

  SharedTextLayoutManager textLayoutManager_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
