/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI37_0_0ParagraphMeasurementCache.h"
#include "ABI37_0_0ParagraphShadowNode.h"

#include <folly/container/EvictingCacheMap.h>
#include <ABI37_0_0React/config/ABI37_0_0ReactNativeConfig.h>
#include <ABI37_0_0React/core/ConcreteComponentDescriptor.h>
#include <ABI37_0_0React/textlayoutmanager/TextLayoutManager.h>
#include <ABI37_0_0React/utils/ContextContainer.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final
    : public ConcreteComponentDescriptor<ParagraphShadowNode> {
 public:
  ParagraphComponentDescriptor(
      EventDispatcher::Shared eventDispatcher,
      ContextContainer::Shared const &contextContainer)
      : ConcreteComponentDescriptor<ParagraphShadowNode>(eventDispatcher) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer);
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `EvictingCacheMap`, a simple LRU cache for Paragraph
    // measurements.
    measureCache_ = std::make_unique<ParagraphMeasurementCache>();
  }

 protected:
  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ParagraphShadowNode>(shadowNode));
    auto paragraphShadowNode =
        std::static_pointer_cast<ParagraphShadowNode>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode->setTextLayoutManager(textLayoutManager_);

    // `ParagraphShadowNode` uses this to cache the results of text rendering
    // measurements.
    paragraphShadowNode->setMeasureCache(
        measureCache_ ? measureCache_.get() : nullptr);

    paragraphShadowNode->dirtyLayout();

    // All `ParagraphShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    paragraphShadowNode->enableMeasurement();
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
  std::unique_ptr<ParagraphMeasurementCache const> measureCache_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
