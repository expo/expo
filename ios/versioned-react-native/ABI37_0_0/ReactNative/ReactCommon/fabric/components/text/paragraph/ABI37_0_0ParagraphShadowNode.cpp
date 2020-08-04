/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ParagraphShadowNode.h"
#include "ABI37_0_0ParagraphMeasurementCache.h"
#include "ABI37_0_0ParagraphState.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

char const ParagraphComponentName[] = "Paragraph";

AttributedString ParagraphShadowNode::getAttributedString() const {
  if (!cachedAttributedString_.has_value()) {
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.apply(getProps()->textAttributes);

    cachedAttributedString_ = BaseTextShadowNode::getAttributedString(
        textAttributes, shared_from_this());
  }

  return cachedAttributedString_.value();
}

void ParagraphShadowNode::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void ParagraphShadowNode::setMeasureCache(
    ParagraphMeasurementCache const *cache) {
  ensureUnsealed();
  measureCache_ = cache;
}

void ParagraphShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto attributedString = getAttributedString();
  auto const &state = getStateData();
  if (state.attributedString == attributedString) {
    return;
  }

  setStateData(ParagraphState{attributedString, textLayoutManager_});
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measure(LayoutConstraints layoutConstraints) const {
  AttributedString attributedString = getAttributedString();

  if (attributedString.isEmpty()) {
    return {0, 0};
  }

  ParagraphAttributes const paragraphAttributes =
      getProps()->paragraphAttributes;

  assert(measureCache_);

  return measureCache_->get(
      ParagraphMeasurementCacheKey{
          attributedString, paragraphAttributes, layoutConstraints},
      [&](ParagraphMeasurementCacheKey const &key) {
        return textLayoutManager_->measure(
            attributedString, paragraphAttributes, layoutConstraints);
      });

  return textLayoutManager_->measure(
      attributedString, paragraphAttributes, layoutConstraints);
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
