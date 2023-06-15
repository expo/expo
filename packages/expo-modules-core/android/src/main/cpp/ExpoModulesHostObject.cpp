// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpoModulesHostObject.h"
#include "LazyObject.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <react/bridging/LongLivedObject.h>

namespace jsi = facebook::jsi;

namespace expo {

ExpoModulesHostObject::ExpoModulesHostObject(JSIInteropModuleRegistry *installer)
  : installer(installer) {}

/**
 * Clears jsi references held by JSRegistry and JavaScriptRuntime. 
 */
ExpoModulesHostObject::~ExpoModulesHostObject() {
  facebook::react::LongLivedObjectCollection::get().clear();
  installer->jsRegistry.reset();
  installer->runtimeHolder.reset();
  installer->jsInvoker.reset();
  installer->nativeInvoker.reset();
  installer->jniDeallocator.reset();
}

jsi::Value ExpoModulesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  auto cName = name.utf8(runtime);

  if (!installer->hasModule(cName)) {
    modulesCache.erase(cName);
    return jsi::Value::undefined();
  }
  if (UniqueJSIObject &cachedObject = modulesCache[cName]) {
    return jsi::Value(runtime, *cachedObject);
  }

  // Create a lazy object for the specific module. It defers initialization of the final module object.
  LazyObject::Shared moduleLazyObject = std::make_shared<LazyObject>(
    [this, cName](jsi::Runtime &rt) {
      auto module = installer->getModule(cName);
      module->cthis()->jsiInteropModuleRegistry = installer;
      return module->cthis()->getJSIObject(rt);
    });

  // Save the module's lazy host object for later use.
  modulesCache[cName] = std::make_unique<jsi::Object>(
    jsi::Object::createFromHostObject(runtime, moduleLazyObject));

  return jsi::Value(runtime, *modulesCache[cName]);
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
