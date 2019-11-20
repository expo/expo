/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ScrollViewShadowNode.h"

#include <ReactABI34_0_0/core/LayoutMetrics.h>

#include "ABI34_0_0ScrollViewLocalData.h"

namespace facebook {
namespace ReactABI34_0_0 {

const char ScrollViewComponentName[] = "ScrollView";

void ScrollViewShadowNode::updateLocalData() {
  ensureUnsealed();

  auto contentBoundingRect = Rect{};
  for (const auto &childNode : getLayoutableChildNodes()) {
    contentBoundingRect.unionInPlace(childNode->getLayoutMetrics().frame);
  }

  const auto &localData =
      std::make_shared<const ScrollViewLocalData>(contentBoundingRect);
  setLocalData(localData);
}

#pragma mark - LayoutableShadowNode

void ScrollViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateLocalData();
}

} // namespace ReactABI34_0_0
} // namespace facebook
