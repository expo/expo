// Copyright 2018-present 650 Industries. All rights reserved.

#include "FabricComponentsRegistry.h"
#include "ExpoComponentDescriptorFactory.h"
#include "../types/FrontendConverterProvider.h"
#include <CoreComponentsRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

// static
void FabricComponentsRegistry::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", FabricComponentsRegistry::initHybrid),
                   makeNativeMethod("registerComponentsRegistry",
                                    FabricComponentsRegistry::registerComponentsRegistry),
                 });
}

// static
jni::local_ref<FabricComponentsRegistry::jhybriddata> FabricComponentsRegistry::initHybrid(
  jni::alias_ref<jhybridobject> jThis
) {
  return makeCxxInstance();
}

void FabricComponentsRegistry::registerComponentsRegistry(
  jni::alias_ref<jni::JArrayClass<jni::JString>> componentNames,
  jni::alias_ref<jni::JArrayClass<jni::JArrayClass<jni::JString>>> statePropNames,
  jni::alias_ref<jni::JArrayClass<jni::JArrayClass<ExpectedType>>> statePropTypes
) {
  // Inject the component to the CoreComponentsRegistry because we don't want to touch the MainApplicationReactNativeHost
  auto providerRegistry = react::CoreComponentsRegistry::sharedProviderRegistry();

  size_t size = componentNames->size();
  assert(size == statePropNames->size());
  assert(size == statePropTypes->size());

  auto frontendConverterProvider = FrontendConverterProvider::instance();

  for (size_t i = 0; i < size; ++i) {
    auto name = componentNames->getElement(i)->toStdString();
    ExpoViewStateProps propMap;

    auto propNames = statePropNames->getElement(i);
    auto propTypes = statePropTypes->getElement(i);
    assert(propNames->size() == propTypes->size());

    for (size_t j = 0; j < propNames->size(); ++j) {
      auto propName = propNames->getElement(j)->toStdString();
      auto propType = propTypes->getElement(j);
      auto converter = frontendConverterProvider->obtainConverter(propType);
      propMap.emplace(propName, converter);
    }

    auto registration = getExpoViewComponentRegistry().registerComponent(
      std::move(name), std::move(propMap)
    );
    auto flavor = registration->flavor;
    auto componentName = react::ComponentName{flavor->c_str()};

    // add() can synchronously call our descriptor factory; hold no Expo registry lock here.
    providerRegistry->add(react::ComponentDescriptorProvider{
      reinterpret_cast<react::ComponentHandle>(componentName),
      componentName,
      flavor,
      &concreteExpoComponentDescriptorConstructor
    });
  }
}

} // namespace expo
