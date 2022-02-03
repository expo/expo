/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0ScrollViewShadowNode.h"

#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutMetrics.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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

Point ScrollViewShadowNode::getContentOriginOffset() const {
  auto contentOffset = getStateData().contentOffset;
  return {-contentOffset.x, -contentOffset.y};
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
