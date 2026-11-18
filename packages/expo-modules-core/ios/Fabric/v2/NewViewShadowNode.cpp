// Copyright 2026-present 650 Industries. All rights reserved.

#include "NewViewShadowNode.h"
#include "NewComponentDescriptor.h"

namespace react = facebook::react;

namespace expo::views {

extern const char placeholderComponentName[] = "ExpoNewViewPlaceholderName";

react::Point NewViewShadowNode::getContentOriginOffset(bool includeTransform) const {
  // Without the transform, the caller asks for a scroll offset, which these views don't have.
  if (!includeTransform) {
    return ConcreteViewShadowNode::getContentOriginOffset(includeTransform);
  }
  // Only `NewComponentDescriptor` creates these nodes.
  const auto &descriptor = static_cast<const NewComponentDescriptor &>(getFamily().getComponentDescriptor());
  if (!descriptor.componentFlavor().isPlacedBySwiftUI) {
    return ConcreteViewShadowNode::getContentOriginOffset(includeTransform);
  }
  // `computeRelativeLayoutMetrics` adds the layout origin of the view before it asks for this offset.
  const auto origin = getLayoutMetrics().frame.origin;
  return {.x = -origin.x, .y = -origin.y};
}

} // namespace expo::views
