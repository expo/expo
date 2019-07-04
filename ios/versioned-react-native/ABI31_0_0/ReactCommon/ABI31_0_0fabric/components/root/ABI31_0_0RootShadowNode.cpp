/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0RootShadowNode.h"

#include <ABI31_0_0fabric/ABI31_0_0components/view/conversions.h>

namespace facebook {
namespace ReactABI31_0_0 {

const char RootComponentName[] = "RootView";

void RootShadowNode::layout() {
  ensureUnsealed();
  layout(getProps()->layoutContext);

  // This is the rare place where shadow node must layout (set `layoutMetrics`)
  // itself because there is no a parent node which usually should do it.
  setLayoutMetrics(layoutMetricsFromYogaNode(yogaNode_));
}

} // namespace ReactABI31_0_0
} // namespace facebook
