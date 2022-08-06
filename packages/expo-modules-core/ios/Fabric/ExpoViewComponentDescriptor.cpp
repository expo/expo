// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewComponentDescriptor.h"

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

} // namespace expo
