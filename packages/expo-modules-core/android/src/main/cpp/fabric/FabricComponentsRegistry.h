// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>
#include <CoreComponentsRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>

#include "../types/ExpectedType.h"
#include "../types/FrontendConverter.h"
#include "AndroidExpoViewComponentDescriptor.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

typedef std::unordered_map<
  AndroidExpoViewComponentDescriptor::Flavor,
  std::unordered_map<std::string, std::shared_ptr<FrontendConverter>>
> StatePropMapType;

extern StatePropMapType statePropMap;

AndroidExpoViewComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
);

class FabricComponentsRegistry : public jni::HybridClass<FabricComponentsRegistry> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/adapters/react/FabricComponentsRegistry;";

  static void registerNatives();

  FabricComponentsRegistry() {};

  void registerComponentsRegistry(
    jni::alias_ref<jni::JArrayClass<jni::JString>> componentNames,
    jni::alias_ref<jni::JArrayClass<jni::JArrayClass<jni::JString>>> statePropNames,
    jni::alias_ref<jni::JArrayClass<jni::JArrayClass<ExpectedType>>> statePropTypes
  );

private:
  static jni::local_ref<jhybriddata> initHybrid(
    jni::alias_ref<jhybridobject> jThis
  );
};

} // namespace expo
