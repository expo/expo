// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>

#include <memory>
#include <unordered_map>

namespace jni = facebook::jni;

namespace expo {

class JCache {
public:
  struct ConstructableJClass {
    jclass clazz;
    jmethodID constructor;
  };

  JCache(JNIEnv *env);

  /**
   * Gets a cached Java class entry or loads it to the registry.
   */
  jclass getOrLoadJClass(JNIEnv *env, const std::string &className);

  ConstructableJClass jDouble;
  ConstructableJClass jBoolean;
  ConstructableJClass jInteger;
  ConstructableJClass jLong;
  ConstructableJClass jFloat;

  ConstructableJClass jPromise;

  jclass jDoubleArray;
  jclass jBooleanArray;
  jclass jIntegerArray;
  jclass jLongArray;
  jclass jFloatArray;

  jclass jCollection;
  jclass jMap;

  jclass jObject;
  jclass jString;

  jclass jJavaScriptObject;
  jclass jJavaScriptValue;
  jclass jJavaScriptTypedArray;

  jclass jReadableNativeArray;
  jclass jReadableNativeMap;
  jclass jWritableNativeArray;
  jclass jWritableNativeMap;

  jclass jSharedObject;
  jclass jJavaScriptModuleObject;

  void unLoad(JNIEnv *env);
private:
  std::unordered_map<std::string, jclass> jClassRegistry;
};

class JCacheHolder {
public:
  static void init(JNIEnv *env);

  static void unLoad(JNIEnv *env);
  /**
   * Gets a singleton instance
   */
  static JCache &get();

private:
  static std::shared_ptr<JCache> jCache;
};

} // namespace expo
