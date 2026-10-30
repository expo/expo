// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpoHeader.pch"
#include "JSIContext.h"

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

  /**
   * Returns the module object for the given module name, or `undefined` when there is no such module.
   */
  jsi::Value getModule(jsi::Runtime &runtime, const std::string &moduleName);

private:
  JSIContext *installer;
  std::unordered_map<std::string, UniqueJSIObject> modulesCache;
};

/**
 * The object installed as `expo.packages`. It returns the object of each npm package by the package name,
 * for example `expo.packages['expo-audio']`.
 */
class ExpoPackagesHostObject : public jsi::HostObject {
public:
  ExpoPackagesHostObject(JSIContext *installer, std::weak_ptr<ExpoModulesHostObject> modulesHostObject);

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  JSIContext *installer;
  std::weak_ptr<ExpoModulesHostObject> modulesHostObject;
  std::unordered_map<std::string, UniqueJSIObject> packagesCache;
};

/**
 * The object installed as `expo.packages[packageName]`. It returns the modules and shared object classes
 * of the package by their names. Modules are the same objects as `expo.modules[moduleName]`
 * and classes are read from the module objects.
 */
class PackageHostObject : public jsi::HostObject {
public:
  PackageHostObject(
    JSIContext *installer,
    std::weak_ptr<ExpoModulesHostObject> modulesHostObject,
    std::string packageName
  );

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  JSIContext *installer;
  std::weak_ptr<ExpoModulesHostObject> modulesHostObject;
  std::string packageName;
};
} // namespace expo
