// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>

#include <memory>
#include <unordered_map>

namespace jni = facebook::jni;

namespace expo {

template <typename T>
inline void hash_combine(std::size_t& seed, const T& v)
{
  std::hash<T> hasher;
  // Reference from: https://github.com/boostorg/container_hash/blob/boost-1.76.0/include/boost/container_hash/hash.hpp
  seed ^= hasher(v) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
}

struct pairhash {
  template <typename A, typename B>
  std::size_t operator()(const std::pair<A, B>& v) const {
    std::size_t seed = 0;
    hash_combine(seed, v.first);
    hash_combine(seed, v.second);
    return seed;
  }
};

using MethodHashMap = std::unordered_map<std::pair<std::string, std::string>, jmethodID, pairhash>;

/**
 * Singleton registry used to store references to often used Java classes.
 */
class JavaReferencesCache {
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

  JavaReferencesCache(JavaReferencesCache const &) = delete;

  JavaReferencesCache &operator=(JavaReferencesCache const &) = delete;

  /**
   * Gets a singleton instance
   */
  static std::shared_ptr<JavaReferencesCache> instance();

  /**
   * Gets a cached Java class entry.
   */
  CachedJClass &getJClass(const std::string &className);

  /**
   * Gets a cached Java class entry or loads it to the registry.
   */
  CachedJClass &getOrLoadJClass(JNIEnv *env, const std::string &className);

  /**
   * Loads predefined set of Java classes and stores them
   */
  void loadJClasses(JNIEnv *env);

private:
  JavaReferencesCache() = default;

  std::unordered_map<std::string, CachedJClass> jClassRegistry;

  void loadJClass(
    JNIEnv *env,
    const std::string &name,
    const std::vector<std::pair<std::string, std::string>> &methods
  );
};
} // namespace expo
