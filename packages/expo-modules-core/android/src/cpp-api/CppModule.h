// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <memory>

#include "NativeModule.h"
#include "EventEmitter.h"
#include "jsi_function_binding.h"
#include "ModuleDefinition.h"
#include "ModuleDefinitionData.h"

namespace jsi = facebook::jsi;

namespace expo {

ModuleDefinitionData ModuleDefinition(std::function<void(const ModuleDefinition &> block) {
  ModuleDefinition builder;
  block(builder);
  return builder.build();
}

class CppModule {
public:
  virtual ~CppModule() = default;

  /**
   * Override this to provide your module definition using the DSL.
   */
  virtual ModuleDefinitionData definition() = 0;

  /**
   * Build the definition once and cache it, then install onto the given parent object.
   */
  void install(jsi::Runtime &rt, jsi::Object &parent);

private:
  std::shared_ptr<jsi::Object> moduleObject_;
};

} // namespace expo
