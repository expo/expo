// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIInteropModuleRegistry.h"

#include <jsi/jsi.h>

#include <vector>

namespace jsi = facebook::jsi;

namespace expo {
/**
 * An entry point to all exported functionalities like modules.
 *
 * An instance of this class will be added to the JS global object.
 */
class ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(JSIInteropModuleRegistry *installer);

  ~ExpoModulesHostObject() override;

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  JSIInteropModuleRegistry *installer;
};
} // namespace expo
