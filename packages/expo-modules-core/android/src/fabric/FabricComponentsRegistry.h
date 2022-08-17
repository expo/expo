// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>

namespace expo {

class FabricComponentsRegistry : public facebook::jni::HybridClass<FabricComponentsRegistry> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/adapters/react/FabricComponentsRegistry;";

  static void registerNatives();

  FabricComponentsRegistry() {};

  void registerComponentsRegistry(
    facebook::jni::alias_ref<facebook::jni::JArrayClass<facebook::jni::JString>> componentNames);

private:
  static facebook::jni::local_ref<jhybriddata> initHybrid(facebook::jni::alias_ref<jhybridobject> jThis);
};

} // namespace expo
