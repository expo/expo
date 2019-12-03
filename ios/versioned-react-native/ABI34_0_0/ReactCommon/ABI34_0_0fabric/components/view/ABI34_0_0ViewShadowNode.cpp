/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ViewShadowNode.h"

namespace facebook {
namespace ReactABI34_0_0 {

const char ViewComponentName[] = "View";

bool ViewShadowNode::isLayoutOnly() const {
  const auto &viewProps = *std::static_pointer_cast<const ViewProps>(props_);

  return viewProps.collapsable &&
      // Event listeners
      !viewProps.onLayout &&
      // Generic Props
      viewProps.nativeId.empty() &&
      // Accessibility Props
      !viewProps.accessible &&
      // Style Props
      viewProps.ABI34_0_0yogaStyle.overflow == ABI34_0_0YGOverflowVisible &&
      viewProps.opacity == 1.0 && !viewProps.backgroundColor &&
      !viewProps.foregroundColor && !viewProps.shadowColor &&
      viewProps.transform == Transform{} && viewProps.zIndex == 0 &&
      // Layout Metrics
      getLayoutMetrics().borderWidth == EdgeInsets{};
}

} // namespace ReactABI34_0_0
} // namespace facebook
