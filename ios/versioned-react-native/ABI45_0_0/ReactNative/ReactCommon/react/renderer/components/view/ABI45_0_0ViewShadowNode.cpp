/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0ViewShadowNode.h"
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/primitives.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

char const ViewComponentName[] = "View";

ViewShadowNode::ViewShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  initialize();
}

ViewShadowNode::ViewShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  initialize();
}

void ViewShadowNode::initialize() noexcept {
  auto &viewProps = static_cast<ViewProps const &>(*props_);

  bool formsStackingContext = !viewProps.collapsable ||
      viewProps.pointerEvents == PointerEventsMode::None ||
      !viewProps.nativeId.empty() || viewProps.accessible ||
      viewProps.opacity != 1.0 || viewProps.transform != Transform{} ||
      viewProps.elevation != 0 ||
      (viewProps.zIndex.has_value() &&
       viewProps.yogaStyle.positionType() != ABI45_0_0YGPositionTypeStatic) ||
      viewProps.yogaStyle.display() == ABI45_0_0YGDisplayNone ||
      viewProps.getClipsContentToBounds() ||
      isColorMeaningful(viewProps.shadowColor) ||
      viewProps.accessibilityElementsHidden ||
      viewProps.accessibilityViewIsModal ||
      viewProps.importantForAccessibility != ImportantForAccessibility::Auto ||
      viewProps.removeClippedSubviews;

  bool formsView = formsStackingContext ||
      isColorMeaningful(viewProps.backgroundColor) ||
      isColorMeaningful(viewProps.foregroundColor) || viewProps.pointerEnter ||
      viewProps.pointerLeave || viewProps.pointerMove ||
      !(viewProps.yogaStyle.border() == ABI45_0_0YGStyle::Edges{}) ||
      !viewProps.testId.empty();

  if (formsView) {
    traits_.set(ShadowNodeTraits::Trait::FormsView);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::FormsView);
  }

  if (formsStackingContext) {
    traits_.set(ShadowNodeTraits::Trait::FormsStackingContext);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::FormsStackingContext);
  }
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
