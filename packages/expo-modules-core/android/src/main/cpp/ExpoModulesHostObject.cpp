// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpoModulesHostObject.h"
#include "LazyObject.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <react/bridging/LongLivedObject.h>

namespace jsi = facebook::jsi;

namespace expo {

ExpoModulesHostObject::ExpoModulesHostObject(JSIContext *installer)
  : installer(installer) {}

/**
 * Clears jsi references held by JSRegistry and JavaScriptRuntime. 
 */
ExpoModulesHostObject::~ExpoModulesHostObject() {
#if REACT_NATIVE_TARGET_VERSION >= 75
  auto &runtime = installer->runtimeHolder->get();
  facebook::react::LongLivedObjectCollection::get(runtime).clear();
#else
  facebook::react::LongLivedObjectCollection::get().clear();
#endif
  installer->prepareForDeallocation();
}

jsi::Value ExpoModulesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  if (installer->wasDeallocated()) {
    return jsi::Value::undefined();
  }

  auto cName = name.utf8(runtime);

  if (UniqueJSIObject &cachedObject = modulesCache[cName]) {
    return jsi::Value(runtime, *cachedObject);
  }

  if (!installer->hasModule(cName)) {
    return jsi::Value::undefined();
  }

  // Create a lazy object for the specific module. It defers initialization of the final module object.
  LazyObject::Shared moduleLazyObject = std::make_shared<LazyObject>(
    [this, cName](jsi::Runtime &rt) {
      // Check if the installer has been deallocated.
      // If so, return nullptr to avoid a "field operation on NULL object" crash.
      // As it's probably the best we can do in this case.
      if (installer->wasDeallocated()) {
        return std::shared_ptr<jsi::Object>(nullptr);
      }

      auto module = installer->getModule(cName);
      return module->cthis()->getJSIObject(rt);
    }
  );

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
