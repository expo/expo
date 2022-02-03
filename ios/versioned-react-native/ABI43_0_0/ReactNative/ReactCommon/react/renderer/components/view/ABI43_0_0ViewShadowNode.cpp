/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0ViewShadowNode.h"
#include <ABI43_0_0React/ABI43_0_0renderer/components/view/primitives.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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

static bool isColorMeaningful(SharedColor const &color) noexcept {
  if (!color) {
    return false;
  }

  return colorComponentsFromColor(color).alpha > 0;
}

void ViewShadowNode::initialize() noexcept {
  auto &viewProps = static_cast<ViewProps const &>(*props_);

  bool formsStackingContext = !viewProps.collapsable ||
      viewProps.pointerEvents == PointerEventsMode::None ||
      !viewProps.nativeId.empty() || viewProps.accessible ||
      viewProps.opacity != 1.0 || viewProps.transform != Transform{} ||
      viewProps.elevation != 0 ||
      (viewProps.zIndex.has_value() &&
       viewProps.yogaStyle.positionType() != ABI43_0_0YGPositionTypeStatic) ||
      viewProps.yogaStyle.display() == ABI43_0_0YGDisplayNone ||
      viewProps.getClipsContentToBounds() ||
      isColorMeaningful(viewProps.shadowColor) ||
      viewProps.accessibilityElementsHidden ||
      viewProps.importantForAccessibility != ImportantForAccessibility::Auto;

  bool formsView = isColorMeaningful(viewProps.backgroundColor) ||
      isColorMeaningful(viewProps.foregroundColor) ||
      !(viewProps.yogaStyle.border() == ABI43_0_0YGStyle::Edges{});

  formsView = formsView || formsStackingContext;

#ifdef ANDROID
  // Force `formsStackingContext` trait for nodes which have `formsView`.
  // TODO: T63560216 Investigate why/how `formsView` entangled with
  // `formsStackingContext`.
  formsStackingContext = formsStackingContext || formsView;
#endif

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

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
