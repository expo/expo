// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpoModulesHostObject.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>

namespace jsi = facebook::jsi;

namespace expo {

ExpoModulesHostObject::ExpoModulesHostObject(JSIInteropModuleRegistry *installer)
  : installer(installer) {}

jsi::Value ExpoModulesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  auto cName = name.utf8(runtime);
  auto module = installer->getModule(cName);
  auto jsiObject = module->cthis()->getJSIObject(runtime);
  return jsi::Value(runtime, *jsiObject);
}

void ExpoModulesHostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                                const jsi::Value &value) {
  std::string message("RuntimeError: Cannot override the host object for expo module '");
  message += name.utf8(runtime);
  throw jsi::JSError(runtime, message);
}

std::vector<jsi::PropNameID> ExpoModulesHostObject::getPropertyNames(jsi::Runtime &rt) {
  return {}; // TODO(@lukmccall): get list of all modules
}
} // namespace expo
