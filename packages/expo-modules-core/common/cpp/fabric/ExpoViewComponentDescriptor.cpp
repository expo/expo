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
  if(!isnan(state._width) or !isnan(state._height)){
    snode->setSize({state._width, state._height});
  }
  ConcreteComponentDescriptor::adopt(shadowNode);
}

} // namespace expo
