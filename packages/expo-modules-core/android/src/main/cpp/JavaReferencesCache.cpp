// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaReferencesCache.h"

#include <vector>

namespace expo {

JCache::JCache(JNIEnv *env) {
#define REGISTER_CLASS_WITH_CONSTRUCTOR(variable, name, signature) \
    { \
      auto clazz = (jclass) env->NewGlobalRef(env->FindClass(name)); \
      variable = { \
        .clazz = clazz, \
        .constructor = env->GetMethodID(clazz, "<init>", signature) \
      }; \
    }

  REGISTER_CLASS_WITH_CONSTRUCTOR(jDouble, "java/lang/Double", "(D)V")
  REGISTER_CLASS_WITH_CONSTRUCTOR(jBoolean, "java/lang/Boolean", "(Z)V")
  REGISTER_CLASS_WITH_CONSTRUCTOR(jInteger, "java/lang/Integer", "(I)V")
  REGISTER_CLASS_WITH_CONSTRUCTOR(jLong, "java/lang/Long", "(J)V")
  REGISTER_CLASS_WITH_CONSTRUCTOR(jFloat, "java/lang/Float", "(F)V")

  REGISTER_CLASS_WITH_CONSTRUCTOR(jPromise, "expo/modules/kotlin/jni/PromiseImpl",
                                  "(Lexpo/modules/kotlin/jni/JavaCallback;)V")

#undef REGISTER_CLASS_WITH_CONSTRUCTOR

#define REGISTER_CLASS(name) (jclass) env->NewGlobalRef(env->FindClass(name))

  jDoubleArray = REGISTER_CLASS("[D");
  jBooleanArray = REGISTER_CLASS("[Z");
  jIntegerArray = REGISTER_CLASS("[I");
  jLongArray = REGISTER_CLASS("[J");
  jFloatArray = REGISTER_CLASS("[F");

  jCollection = REGISTER_CLASS("java/util/Collection");
  jMap = REGISTER_CLASS("java/util/Map");

  jObject = REGISTER_CLASS("java/lang/Object");
  jString = REGISTER_CLASS("java/lang/String");

  jJavaScriptObject = REGISTER_CLASS("expo/modules/kotlin/jni/JavaScriptObject");
  jJavaScriptValue = REGISTER_CLASS("expo/modules/kotlin/jni/JavaScriptValue");
  jJavaScriptTypedArray = REGISTER_CLASS("expo/modules/kotlin/jni/JavaScriptTypedArray");

  jReadableNativeArray = REGISTER_CLASS("com/facebook/react/bridge/ReadableNativeArray");
  jReadableNativeMap = REGISTER_CLASS("com/facebook/react/bridge/ReadableNativeMap");
  jWritableNativeArray = REGISTER_CLASS("com/facebook/react/bridge/WritableNativeArray");
  jWritableNativeMap = REGISTER_CLASS("com/facebook/react/bridge/WritableNativeMap");

  jSharedObject = REGISTER_CLASS("expo/modules/kotlin/sharedobjects/SharedObject");
  jJavaScriptModuleObject = REGISTER_CLASS("expo/modules/kotlin/jni/JavaScriptModuleObject");

#undef REGISTER_CLASS
}

std::shared_ptr<JCache> JCacheHolder::jCache = nullptr;

void JCacheHolder::init(JNIEnv *env) {
  jCache = std::make_shared<JCache>(env);
}

void JCacheHolder::unLoad(JNIEnv *env) {
  jCache->unLoad(env);
  jCache.reset();
}

JCache &JCacheHolder::get() {
  return *jCache;
}

jclass JCache::getOrLoadJClass(
  JNIEnv *env,
  const std::string &className
) {
  auto result = jClassRegistry.find(className);
  if (result == jClassRegistry.end()) {
    auto clazz = (jclass) env->NewGlobalRef(env->FindClass(className.c_str()));
    jClassRegistry.insert({className, clazz});
    return clazz;
  }

  return result->second;
}

void JCache::unLoad(JNIEnv *env) {
  env->DeleteGlobalRef(jDoubleArray);
  env->DeleteGlobalRef(jBooleanArray);
  env->DeleteGlobalRef(jIntegerArray);
  env->DeleteGlobalRef(jLongArray);
  env->DeleteGlobalRef(jFloatArray);
  env->DeleteGlobalRef(jCollection);
  env->DeleteGlobalRef(jMap);
  env->DeleteGlobalRef(jObject);
  env->DeleteGlobalRef(jString);
  env->DeleteGlobalRef(jJavaScriptObject);
  env->DeleteGlobalRef(jJavaScriptValue);
  env->DeleteGlobalRef(jJavaScriptTypedArray);
  env->DeleteGlobalRef(jReadableNativeArray);
  env->DeleteGlobalRef(jReadableNativeMap);
  env->DeleteGlobalRef(jWritableNativeArray);
  env->DeleteGlobalRef(jWritableNativeMap);
  env->DeleteGlobalRef(jSharedObject);
  env->DeleteGlobalRef(jJavaScriptModuleObject);
}

} // namespace expo
