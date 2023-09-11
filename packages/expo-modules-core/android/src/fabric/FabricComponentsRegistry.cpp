// Copyright 2018-present 650 Industries. All rights reserved.

#include "FabricComponentsRegistry.h"

#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#include <CoreComponentsRegistry.h>

#include "ExpoViewComponentDescriptor.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

// static
void FabricComponentsRegistry::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", FabricComponentsRegistry::initHybrid),
    makeNativeMethod("registerComponentsRegistry", FabricComponentsRegistry::registerComponentsRegistry),
  });
}

// static
jni::local_ref<FabricComponentsRegistry::jhybriddata>
FabricComponentsRegistry::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance();
}

void FabricComponentsRegistry::registerComponentsRegistry(
  jni::alias_ref<jni::JArrayClass<jni::JString>> componentNames) {
  // Inject the component to the CoreComponentsRegistry because we don't want to touch the MainApplicationReactNativeHost
  auto providerRegistry = react::CoreComponentsRegistry::sharedProviderRegistry();

  size_t size = componentNames->size();
  for (size_t i = 0; i < size; ++i) {
    auto flavor = std::make_shared<std::string const>(componentNames->getElement(i)->toStdString());
    auto componentName = react::ComponentName{flavor->c_str()};
    providerRegistry->add(react::ComponentDescriptorProvider {
      reinterpret_cast<react::ComponentHandle>(componentName),
      componentName,
      flavor,
      &facebook::react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor>
    });
  }
}

} // namespace expo
