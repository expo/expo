// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include "boost/functional/hash.hpp"

#include <memory>
#include <unordered_map>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
using MethodHashMap = std::unordered_map<
  std::pair<std::string, std::string>,
  jmethodID,
  boost::hash<std::pair<std::string, std::string>>
>;

/**
 * Singleton registry used to store references to often used Java classes.
 */
class JavaCachedReferencesRegistry {
public:
  /**
   * An entry in the Java class registry.
   */
  class CachedJClass {
  public:
    CachedJClass(jclass clazz, MethodHashMap methods);

    /**
     * A bare reference to the class object.
     */
    jclass clazz;

    /**
     * Returns a cached method id for provided method name and signature.
     */
    jmethodID getMethod(const std::string &name, const std::string &signature);

  private:
    MethodHashMap methods;
  };

  JavaCachedReferencesRegistry(JavaCachedReferencesRegistry const &) = delete;

  JavaCachedReferencesRegistry &operator=(JavaCachedReferencesRegistry const &) = delete;

  /**
   * Gets a singleton instance
   */
  static std::shared_ptr<JavaCachedReferencesRegistry> instance();

  /**
   * Gets a cached Java class entry.
   */
  CachedJClass &getJClass(const std::string &className);

  /**
   * Loads predefined set of Java classes and stores them
   */
  void loadJClasses(JNIEnv *env);

private:
  JavaCachedReferencesRegistry() = default;

  std::unordered_map<std::string, CachedJClass> jClassRegistry;

  void loadJClass(
    JNIEnv *env,
    const std::string &name,
    const std::vector<std::pair<std::string, std::string>> &methods
  );
};

/**
 * Registry used to store references to often used JS objects like Promise.
 * The object lifetime should be bound with the JS runtime.
 */
class JSCachedReferencesRegistry {
public:
  enum class JSKeys {
    PROMISE,
    CODED_ERROR
  };

  JSCachedReferencesRegistry() = delete;

  JSCachedReferencesRegistry(jsi::Runtime &runtime);

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
