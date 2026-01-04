// Copyright 2018-present 650 Industries. All rights reserved.

#include "FabricComponentsRegistry.h"
#include "../types/FrontendConverterProvider.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wextern-initializer"
// Clang think that we don't need to initialize the extern variable here, but we do.
extern StatePropMapType statePropMap = {};
#pragma clang diagnostic pop

AndroidExpoViewComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
) {
  auto descriptor = std::make_unique<AndroidExpoViewComponentDescriptor>(
    parameters,
    react::RawPropsParser(/*useRawPropsJsiValue=*/true)
  );

  descriptor->setStateProps(
    statePropMap.at(
      std::static_pointer_cast<std::string const>(parameters.flavor)
    )
  );
  return descriptor;
}

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
  statePropMap.clear();

  // Inject the component to the CoreComponentsRegistry because we don't want to touch the MainApplicationReactNativeHost
  auto providerRegistry = react::CoreComponentsRegistry::sharedProviderRegistry();

  size_t size = componentNames->size();
  assert(size == statePropNames->size());
  assert(size == statePropTypes->size());

  auto frontendConverterProvider = FrontendConverterProvider::instance();

  for (size_t i = 0; i < size; ++i) {
    auto flavor = std::make_shared<std::string const>(componentNames->getElement(i)->toStdString());
    auto componentName = react::ComponentName{flavor->c_str()};

    std::unordered_map<std::string, std::shared_ptr<FrontendConverter>> propMap;

    auto propNames = statePropNames->getElement(i);
    auto propTypes = statePropTypes->getElement(i);
    assert(propNames->size() == propTypes->size());

    for (size_t j = 0; j < propNames->size(); ++j) {
      auto propName = propNames->getElement(j)->toStdString();
      auto propType = propTypes->getElement(j);
      auto converter = frontendConverterProvider->obtainConverter(propType);
      propMap.emplace(propName, converter);
    }

    statePropMap.emplace(
      flavor,
      propMap
    );

    providerRegistry->add(react::ComponentDescriptorProvider{
      reinterpret_cast<react::ComponentHandle>(componentName),
      componentName,
      flavor,
      &concreteExpoComponentDescriptorConstructor
    });
  }
}

} // namespace expo
