// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewComponentDescriptor.h"

namespace ABI48_0_0expo {

ExpoViewComponentDescriptor::ExpoViewComponentDescriptor(ABI48_0_0facebook::ABI48_0_0React::ComponentDescriptorParameters const &parameters)
  : ABI48_0_0facebook::ABI48_0_0React::ConcreteComponentDescriptor<ExpoViewShadowNode>(parameters) {
}

ABI48_0_0facebook::ABI48_0_0React::ComponentHandle ExpoViewComponentDescriptor::getComponentHandle() const {
  return reinterpret_cast<ABI48_0_0facebook::ABI48_0_0React::ComponentHandle>(getComponentName());
}

ABI48_0_0facebook::ABI48_0_0React::ComponentName ExpoViewComponentDescriptor::getComponentName() const {
  return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
}

} // namespace ABI48_0_0expo
