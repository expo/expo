// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewComponentDescriptor.h"


#if REACT_NATIVE_TARGET_VERSION >= 73 && IS_NEW_ARCHITECTURE_ENABLED
// Android can't find the definition of these static fields
bool facebook::react::CoreFeatures::enableDefaultAsyncBatchedPriority;
bool facebook::react::CoreFeatures::enablePropIteratorSetter;
#endif

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
