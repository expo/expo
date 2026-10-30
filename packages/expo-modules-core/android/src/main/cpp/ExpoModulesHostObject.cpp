// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpoHeader.pch"
#include "ExpoModulesHostObject.h"
#include "LazyObject.h"

#include <react/bridging/LongLivedObject.h>

namespace jsi = facebook::jsi;

namespace expo {

ExpoModulesHostObject::ExpoModulesHostObject(JSIContext *installer)
  : installer(installer) {}

/**
 * Clears jsi references held by JSRegistry and JavaScriptRuntime.
 */
ExpoModulesHostObject::~ExpoModulesHostObject() {
  auto &runtime = installer->runtimeHolder->get();
  facebook::react::LongLivedObjectCollection::get(runtime).clear();
  installer->prepareForDeallocation();
}

jsi::Value ExpoModulesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  if (installer->wasDeallocated()) {
    return jsi::Value::undefined();
  }

  return getModule(runtime, name.utf8(runtime));
}

jsi::Value ExpoModulesHostObject::getModule(jsi::Runtime &runtime, const std::string &cName) {
  if (auto cachedObject = modulesCache.find(cName); cachedObject != modulesCache.end()) {
    return jsi::Value(runtime, *cachedObject->second);
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
ExpoPackagesHostObject::ExpoPackagesHostObject(
  JSIContext *installer,
  std::weak_ptr<ExpoModulesHostObject> modulesHostObject
) : installer(installer), modulesHostObject(std::move(modulesHostObject)) {}

jsi::Value ExpoPackagesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  if (installer->wasDeallocated()) {
    return jsi::Value::undefined();
  }

  auto packageName = name.utf8(runtime);

  if (auto cachedPackage = packagesCache.find(packageName); cachedPackage != packagesCache.end()) {
    return jsi::Value(runtime, *cachedPackage->second);
  }

  if (!installer->hasPackage(packageName)) {
    return jsi::Value::undefined();
  }

  auto packageHostObject = std::make_shared<PackageHostObject>(installer, modulesHostObject, packageName);
  auto [entry, _] = packagesCache.emplace(
    packageName,
    std::make_unique<jsi::Object>(jsi::Object::createFromHostObject(runtime, packageHostObject))
  );
  return jsi::Value(runtime, *entry->second);
}

void ExpoPackagesHostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                                 const jsi::Value &value) {
  throw jsi::JSError(
    runtime,
    "RuntimeError: Cannot override the host object for the expo package '" + name.utf8(runtime) + "'"
  );
}

std::vector<jsi::PropNameID> ExpoPackagesHostObject::getPropertyNames(jsi::Runtime &rt) {
  if (installer->wasDeallocated()) {
    return {};
  }
  auto names = installer->getPackageNames();
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

PackageHostObject::PackageHostObject(
  JSIContext *installer,
  std::weak_ptr<ExpoModulesHostObject> modulesHostObject,
  std::string packageName
) : installer(installer), modulesHostObject(std::move(modulesHostObject)), packageName(std::move(packageName)) {}

jsi::Value PackageHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  auto modules = modulesHostObject.lock();
  if (modules == nullptr || installer->wasDeallocated()) {
    return jsi::Value::undefined();
  }

  auto exportName = name.utf8(runtime);
  auto owner = installer->getPackageExportOwner(packageName, exportName);
  if (!owner.has_value()) {
    return jsi::Value::undefined();
  }

  auto moduleObject = modules->getModule(runtime, *owner);
  if (*owner == exportName || !moduleObject.isObject()) {
    return moduleObject;
  }
  // Classes are installed on the module object, so the class is the same object as `module[exportName]`.
  return moduleObject.getObject(runtime).getProperty(runtime, exportName.c_str());
}

void PackageHostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                              const jsi::Value &value) {
  throw jsi::JSError(
    runtime,
    "RuntimeError: Cannot override the export '" + name.utf8(runtime) + "' of the expo package '" + packageName + "'"
  );
}

std::vector<jsi::PropNameID> PackageHostObject::getPropertyNames(jsi::Runtime &rt) {
  if (installer->wasDeallocated()) {
    return {};
  }
  auto names = installer->getPackageExportNames(packageName);
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
