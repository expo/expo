// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewShadowNode.h"

namespace react = facebook::react;

namespace expo {

extern const char ExpoViewComponentName[] = "ExpoFabricView";

ExpoViewShadowNode::ExpoViewShadowNode(
    const react::ShadowNodeFragment &fragment,
    const react::ShadowNodeFamily::Shared &family,
    react::ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, [&]() {
      // if measureableNode is true, set the traits to leaf yoga node and measurable yoga node
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

  if (YGNodeStyleGetDisplay(&yogaNode_) == YGDisplayContents) {
    auto it = viewProps.propsMap.find("disableForceFlatten");
    bool disableForceFlatten = (it != viewProps.propsMap.end()) ? it->second.getBool() : false;
    
    if (disableForceFlatten) {
      traits_.unset(react::ShadowNodeTraits::Trait::ForceFlattenView);
    }
  }
}

react::Size ExpoViewShadowNode::measureContent(const react::LayoutContext& layoutContext, 
  const react::LayoutConstraints& layoutConstraints) const {
  const auto state = getStateData();
  float finalWidth = state._measuredWidth;
  float finalHeight = state._measuredHeight;
  return react::Size{finalWidth, finalHeight};
}

} // namespace expo
