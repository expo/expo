// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include "../ExpoHeader.pch"
#include "../types/ExpectedType.h"

namespace jni = facebook::jni;

namespace expo {

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
