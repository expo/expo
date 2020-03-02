/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ViewShadowNode.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

const char ViewComponentName[] = "View";

bool ViewShadowNode::isLayoutOnly() const {
  const auto &viewProps = *std::static_pointer_cast<const ViewProps>(props_);

  return viewProps.collapsable &&
      // Generic Props
      viewProps.nativeId.empty() &&
      // Accessibility Props
      !viewProps.accessible &&
      // Style Props
      viewProps.opacity == 1.0 && !viewProps.backgroundColor &&
      !viewProps.foregroundColor && !viewProps.shadowColor &&
      viewProps.transform == Transform{} && viewProps.zIndex == 0 &&
      !viewProps.getClipsContentToBounds() &&
      // Layout Metrics
      getLayoutMetrics().borderWidth == EdgeInsets{};
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
