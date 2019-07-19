/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI34_0_0ParagraphMeasurementCache.h"
#include "ABI34_0_0ParagraphShadowNode.h"

#include <folly/container/EvictingCacheMap.h>
#include <ReactABI34_0_0/core/ConcreteComponentDescriptor.h>
#include <ReactABI34_0_0/textlayoutmanager/TextLayoutManager.h>
#include <ReactABI34_0_0/uimanager/ContextContainer.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final
    : public ConcreteComponentDescriptor<ParagraphShadowNode> {
 public:
  ParagraphComponentDescriptor(
      SharedEventDispatcher eventDispatcher,
      const SharedContextContainer &contextContainer)
      : ConcreteComponentDescriptor<ParagraphShadowNode>(eventDispatcher) {
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `TextLayoutManager`.
    textLayoutManager_ = std::make_shared<TextLayoutManager>(contextContainer);
    // Every single `ParagraphShadowNode` will have a reference to
    // a shared `EvictingCacheMap`, a simple LRU cache for Paragraph
    // measurements.
#ifdef ANDROID
    auto paramName = "ReactABI34_0_0_fabric:enabled_paragraph_measure_cache_android";
#else
    auto paramName = "ReactABI34_0_0_fabric:enabled_paragraph_measure_cache_ios";
#endif
    // TODO: T39927960 - get rid of this if statement
    bool enableCache =
        (contextContainer != nullptr
             ? contextContainer
                   ->getInstance<std::shared_ptr<const ReactABI34_0_0NativeConfig>>(
                       "ReactABI34_0_0NativeConfig")
                   ->getBool(paramName)
             : false);
    if (enableCache) {
      measureCache_ = std::make_unique<ParagraphMeasurementCache>();
    } else {
      measureCache_ = nullptr;
    }
  }

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

    // All `ParagraphShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    paragraphShadowNode->enableMeasurement();
  }

 private:
  SharedTextLayoutManager textLayoutManager_;
  std::unique_ptr<const ParagraphMeasurementCache> measureCache_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
