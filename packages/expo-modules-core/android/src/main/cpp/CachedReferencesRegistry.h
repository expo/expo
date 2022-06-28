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
 *
 * TODO(@lukmccall): also store reference to jsi objects like `Promise`.
 */
class CachedReferencesRegistry {
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

  CachedReferencesRegistry(CachedReferencesRegistry const &) = delete;

  CachedReferencesRegistry &operator=(CachedReferencesRegistry const &) = delete;

  /**
   * Gets a singleton instance
   */
  static std::shared_ptr<CachedReferencesRegistry> instance();

  /**
   * Gets a cached Java class entry.
   */
  CachedJClass &getJClass(const std::string &className);

  /**
   * Loads predefined set of Java classes and stores them
   */
  void loadJClasses(JNIEnv *env);

private:
  CachedReferencesRegistry() = default;

  std::unordered_map<std::string, CachedJClass> jClassRegistry;

  void loadJClass(
    JNIEnv *env,
    const std::string &name,
    const std::vector<std::pair<std::string, std::string>> &methods
  );
};
} // namespace expo
