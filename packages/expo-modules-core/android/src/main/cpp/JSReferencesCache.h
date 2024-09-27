// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JavaReferencesCache.h"
#include "Exceptions.h"
#include "JavaScriptObject.h"
#include "JavaScriptRuntime.h"
#include "JSIObjectWrapper.h"
#include "WeakRuntimeHolder.h"

#include <jsi/jsi.h>
#include <memory>
#include <unordered_map>

namespace expo {
/**
 * Registry used to store references to often used JS objects like Promise.
 * The object lifetime should be bound with the JS runtime.
 */
class JSReferencesCache {
public:
  enum class JSKeys {
    PROMISE
  };

  explicit JSReferencesCache(jsi::Runtime &runtime);

  /**
   * Gets a cached object.
   */
  template<class T, typename std::enable_if_t<std::is_base_of_v<jsi::Object, T>, int> = 0>
  T &getObject(JSKeys key) {
    return static_cast<T &>(*jsObjectRegistry.at(key));
  }

  /**
   * Gets a cached object if present. Otherwise, returns nullptr.
   */
  template<class T, typename std::enable_if_t<std::is_base_of_v<jsi::Object, T>, int> = 0>
  T *getOptionalObject(JSKeys key) {
    auto result = jsObjectRegistry.find(key);

    if (result == jsObjectRegistry.end()) {
      return nullptr;
    }
    jsi::Object &object = *result->second;
    return &static_cast<T &>(object);
  }

  /**
   * Gets a cached jsi::PropNameID or creates a new one for the provided string.
   */
  jsi::PropNameID &getPropNameID(jsi::Runtime &runtime, const std::string &name);

private:
  std::unordered_map<JSKeys, std::unique_ptr<jsi::Object>> jsObjectRegistry;

  std::unordered_map<std::string, std::unique_ptr<jsi::PropNameID>> propNameIDRegistry;
};
} // namespace expo
