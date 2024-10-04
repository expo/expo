/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0ScrollViewShadowNode.h"

#include <ABI42_0_0React/core/LayoutMetrics.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

const char ScrollViewComponentName[] = "ScrollView";

void ScrollViewShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto contentBoundingRect = Rect{};
  for (const auto &childNode : getLayoutableChildNodes()) {
    contentBoundingRect.unionInPlace(childNode->getLayoutMetrics().frame);
  }

  auto state = getStateData();

  if (state.contentBoundingRect != contentBoundingRect) {
    state.contentBoundingRect = contentBoundingRect;
    setStateData(std::move(state));
  }
}

#pragma mark - LayoutableShadowNode

void ScrollViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateStateIfNeeded();
}

Transform ScrollViewShadowNode::getTransform() const {
  auto transform = ConcreteViewShadowNode::getTransform();
  auto contentOffset = getStateData().contentOffset;
  return transform *
      Transform::Translate(-contentOffset.x, -contentOffset.y, 0);
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
