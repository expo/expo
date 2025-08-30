// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewShadowNode.h"

namespace react = facebook::react;

namespace expo {

extern const char ExpoViewComponentName[] = "ExpoFabricView";

ExpoViewShadowNode::ExpoViewShadowNode(
    const react::ShadowNodeFragment &fragment,
    const react::ShadowNodeFamily::Shared &family,
    react::ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
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
  // This is needed for display: contents, so that native view is still rendered
  // https://github.com/facebook/react-native/blob/b02251e7f5c147296fab93c1ae613d27400cec92/packages/react-native/ReactCommon/react/renderer/components/view/YogaLayoutableShadowNode.cpp#L399
  // Without it the native view is flattened and not added to native hierarchy
  if (viewProps.collapsable == false) {
    traits_.unset(react::ShadowNodeTraits::Trait::ForceFlattenView);
  }
}

} // namespace expo
