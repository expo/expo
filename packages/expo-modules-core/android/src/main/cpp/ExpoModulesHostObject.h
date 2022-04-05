// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIInteropModuleRegistry.h"

#include <jsi/jsi.h>

#include <vector>

namespace jsi = facebook::jsi;

namespace expo {
class ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(JSIInteropModuleRegistry *installer);

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  JSIInteropModuleRegistry *installer;
};
}
