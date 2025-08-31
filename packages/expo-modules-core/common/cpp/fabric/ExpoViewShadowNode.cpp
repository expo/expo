// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewShadowNode.h"
#include <algorithm>

namespace react = facebook::react;

namespace expo {

extern const char ExpoViewComponentName[] = "ExpoFabricView";

ExpoViewShadowNode::ExpoViewShadowNode(
    const react::ShadowNodeFragment &fragment,
    const react::ShadowNodeFamily::Shared &family,
    react::ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, [&]() {
        if (fragment.props) {
          auto &props = static_cast<const ExpoViewProps &>(*fragment.props);
          auto measureableNodeIt = props.propsMap.find("measureableNode");
          if (measureableNodeIt != props.propsMap.end() && measureableNodeIt->second.getBool()) {
            traits.set(react::ShadowNodeTraits::Trait::LeafYogaNode);
            traits.set(react::ShadowNodeTraits::Trait::MeasurableYogaNode);
          }
        }
        return traits;
      }()) {
  initialize();
}

ExpoViewShadowNode::ExpoViewShadowNode(
    const react::ShadowNode &sourceShadowNode,
    const react::ShadowNodeFragment &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  initialize();
}

void ExpoViewShadowNode::initialize() noexcept {
  auto &viewProps = static_cast<const ExpoViewProps &>(*props_);

  if (viewProps.collapsableChildren) {
    traits_.set(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  } else {
    traits_.unset(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  }
}

react::Size ExpoViewShadowNode::measureContent(
    const react::LayoutContext& layoutContext,
    const react::LayoutConstraints& layoutConstraints) const {
  const auto state = getStateData();
  float intrinsicWidth = !std::isnan(state._intrinsicWidth) ? state._intrinsicWidth : 0.0f;
  float intrinsicHeight = !std::isnan(state._intrinsicHeight) ? state._intrinsicHeight : 0.0f;
  // respect the layout constraints while using intrinsic size as preference
  float finalWidth = std::min(std::max(intrinsicWidth, static_cast<float>(layoutConstraints.minimumSize.width)), static_cast<float>(layoutConstraints.maximumSize.width));
  float finalHeight = std::min(std::max(intrinsicHeight, static_cast<float>(layoutConstraints.minimumSize.height)), static_cast<float>(layoutConstraints.maximumSize.height));
  return react::Size{finalWidth, finalHeight};
}

} // namespace expo
