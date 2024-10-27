// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIContext.h"

#include <jsi/jsi.h>

#include <vector>
#import <unordered_map>

namespace jsi = facebook::jsi;

namespace expo {

using UniqueJSIObject = std::unique_ptr<jsi::Object>;

/**
 * An entry point to all exported functionalities like modules.
 *
 * An instance of this class will be added to the JS global object.
 */
class ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(JSIContext *installer);

  ~ExpoModulesHostObject() override;

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  JSIContext *installer;
  std::unordered_map<std::string, UniqueJSIObject> modulesCache;
};
} // namespace expo
