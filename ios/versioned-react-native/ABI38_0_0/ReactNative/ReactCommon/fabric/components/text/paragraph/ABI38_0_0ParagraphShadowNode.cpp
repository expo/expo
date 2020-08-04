/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0ParagraphShadowNode.h"

#include <ABI38_0_0React/attributedstring/AttributedStringBox.h>
#include "ABI38_0_0ParagraphState.h"

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

char const ParagraphComponentName[] = "Paragraph";

AttributedString ParagraphShadowNode::getAttributedString() const {
  if (!cachedAttributedString_.has_value()) {
    auto textAttributes = TextAttributes::defaultTextAttributes();
    textAttributes.apply(getProps()->textAttributes);

    cachedAttributedString_ =
        BaseTextShadowNode::getAttributedString(textAttributes, *this);
  }

  return cachedAttributedString_.value();
}

void ParagraphShadowNode::setTextLayoutManager(
    SharedTextLayoutManager textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = textLayoutManager;
}

void ParagraphShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto attributedString = getAttributedString();
  auto const &state = getStateData();

  assert(textLayoutManager_);
  assert(
      (!state.layoutManager || state.layoutManager == textLayoutManager_) &&
      "`StateData` refers to a different `TextLayoutManager`");

  if (state.attributedString == attributedString &&
      state.layoutManager == textLayoutManager_) {
    return;
  }

  setStateData(ParagraphState{
      attributedString, getProps()->paragraphAttributes, textLayoutManager_});
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measure(LayoutConstraints layoutConstraints) const {
  AttributedString attributedString = getAttributedString();

  if (attributedString.isEmpty()) {
    return layoutConstraints.clamp({0, 0});
  }

  return textLayoutManager_->measure(
      AttributedStringBox{attributedString},
      getProps()->paragraphAttributes,
      layoutConstraints);
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
