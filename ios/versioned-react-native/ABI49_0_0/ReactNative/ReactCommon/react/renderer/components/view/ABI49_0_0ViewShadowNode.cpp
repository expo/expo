/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ViewShadowNode.h"
#include <ABI49_0_0React/config/ABI49_0_0ReactNativeConfig.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/primitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0CoreFeatures.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

char const ViewComponentName[] = "View";

ViewShadowNodeProps::ViewShadowNodeProps(
    PropsParserContext const &context,
    ViewShadowNodeProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(
          context,
          sourceProps,
          rawProps,
          !CoreFeatures::enableMapBuffer){};

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
      (viewProps.zIndex.has_value() &&
       viewProps.yogaStyle.positionType() != ABI49_0_0YGPositionTypeStatic) ||
      viewProps.yogaStyle.display() == ABI49_0_0YGDisplayNone ||
      viewProps.getClipsContentToBounds() || viewProps.events.bits.any() ||
      isColorMeaningful(viewProps.shadowColor) ||
      viewProps.accessibilityElementsHidden ||
      viewProps.accessibilityViewIsModal ||
      viewProps.importantForAccessibility != ImportantForAccessibility::Auto ||
      viewProps.removeClippedSubviews;

#ifdef ANDROID
  formsStackingContext = formsStackingContext || viewProps.elevation != 0;
#endif

  bool formsView = formsStackingContext ||
      isColorMeaningful(viewProps.backgroundColor) ||
      isColorMeaningful(viewProps.foregroundColor) ||
      !(viewProps.yogaStyle.border() == ABI49_0_0YGStyle::Edges{}) ||
      !viewProps.testId.empty();

#ifdef ANDROID
  formsView = formsView || viewProps.nativeBackground.has_value() ||
      viewProps.nativeForeground.has_value() || viewProps.focusable ||
      viewProps.hasTVPreferredFocus ||
      viewProps.needsOffscreenAlphaCompositing ||
      viewProps.renderToHardwareTextureAndroid;
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

#ifdef ANDROID
  traits_.set(ShadowNodeTraits::Trait::AndroidMapBufferPropsSupported);
#endif
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
