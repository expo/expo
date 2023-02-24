/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0ViewShadowNode.h"
#include <ABI47_0_0React/ABI47_0_0config/ABI47_0_0ReactNativeConfig.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/primitives.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

char const ViewComponentName[] = "View";

static inline bool keepRawValuesInViewProps(PropsParserContext const &context) {
  static bool shouldUseRawProps = true;

#ifdef ANDROID
  static bool initialized = false;

  if (!initialized) {
    auto config =
        context.contextContainer.find<std::shared_ptr<const ABI47_0_0ReactNativeConfig>>(
            "ABI47_0_0ReactNativeConfig");
    if (config.has_value()) {
      initialized = true;
      shouldUseRawProps = !config.value()->getBool(
          "ABI47_0_0React_native_new_architecture:use_mapbuffer_for_viewprops");
    }
  }
#endif

  return shouldUseRawProps;
}

ViewShadowNodeProps::ViewShadowNodeProps(
    PropsParserContext const &context,
    ViewShadowNodeProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(
          context,
          sourceProps,
          rawProps,
          keepRawValuesInViewProps(context)){};

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
       viewProps.yogaStyle.positionType() != ABI47_0_0YGPositionTypeStatic) ||
      viewProps.yogaStyle.display() == ABI47_0_0YGDisplayNone ||
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
      !(viewProps.yogaStyle.border() == ABI47_0_0YGStyle::Edges{}) ||
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
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
