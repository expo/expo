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
  if (module == nullptr) {
    return jsi::Value::undefined();
  }

  module->cthis()->jsiInteropModuleRegistry = installer;
  auto jsiObject = module->cthis()->getJSIObject(runtime);
  return jsi::Value(runtime, *jsiObject);
}

void ExpoModulesHostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                                const jsi::Value &value) {
  throw jsi::JSError(
    runtime,
    "RuntimeError: Cannot override the host object for expo module '" + name.utf8(runtime) + "'"
  );
}

std::vector<jsi::PropNameID> ExpoModulesHostObject::getPropertyNames(jsi::Runtime &rt) {
  auto names = installer->getModulesName();
  size_t size = names->size();
  std::vector<jsi::PropNameID> result;
  result.reserve(size);
  for (int i = 0; i < size; i++) {
    result.push_back(
      jsi::PropNameID::forUtf8(rt, names->getElement(i)->toStdString())
    );
  }
  return result;
}
} // namespace expo
