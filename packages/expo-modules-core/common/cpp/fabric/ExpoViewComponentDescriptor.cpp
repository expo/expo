// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewComponentDescriptor.h"
#include <react/renderer/core/ShadowNode.h>
#include <cmath>

namespace expo {

ExpoViewComponentDescriptor::ExpoViewComponentDescriptor(facebook::react::ComponentDescriptorParameters const &parameters)
  : facebook::react::ConcreteComponentDescriptor<ExpoViewShadowNode>(parameters) {
}

facebook::react::ComponentHandle ExpoViewComponentDescriptor::getComponentHandle() const {
  return reinterpret_cast<facebook::react::ComponentHandle>(getComponentName());
}

facebook::react::ComponentName ExpoViewComponentDescriptor::getComponentName() const {
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

void ExpoViewComponentDescriptor::adopt(facebook::react::ShadowNode &shadowNode) const {
  react_native_assert(dynamic_cast<ExpoViewShadowNode *>(&shadowNode));

  const auto snode = dynamic_cast<ExpoViewShadowNode *>(&shadowNode);
  const auto state = snode->getStateData();

  auto width = state._width;
  auto height = state._height;

  if (!isnan(width) or !isnan(height)) {
    auto const &props = *std::static_pointer_cast<const facebook::react::ViewProps>(snode->getProps());

    // The node has width and/or height set as style props, so we should not override it
    auto widthProp = props.yogaStyle.dimension(facebook::yoga::Dimension::Width);
    auto heightProp = props.yogaStyle.dimension(facebook::yoga::Dimension::Height);

    if (widthProp.value().isDefined()) {
      // view has fixed dimension size set in props, so we should not autosize it in that axis
      width = widthProp.value().unwrap();
    }
    if (heightProp.value().isDefined()) {
      height = heightProp.value().unwrap();
    }

    snode->setSize({width, height});
  }
  ConcreteComponentDescriptor::adopt(shadowNode);
}

} // namespace expo
