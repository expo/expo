/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0ScrollViewShadowNode.h"

#include <ABI31_0_0fabric/ABI31_0_0core/LayoutMetrics.h>

#include "ABI31_0_0ScrollViewLocalData.h"

namespace facebook {
namespace ReactABI31_0_0 {

const char ScrollViewComponentName[] = "ScrollView";

void ScrollViewShadowNode::updateLocalData() {
  ensureUnsealed();

  Rect contentBoundingRect;
  for (const auto &childNode : getLayoutableChildNodes()) {
    contentBoundingRect.unionInPlace(childNode->getLayoutMetrics().frame);
  }

  const auto &localData = std::make_shared<const ScrollViewLocalData>(contentBoundingRect);
  setLocalData(localData);
}

#pragma mark - LayoutableShadowNode

void ScrollViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateLocalData();
}

} // namespace ReactABI31_0_0
} // namespace facebook
