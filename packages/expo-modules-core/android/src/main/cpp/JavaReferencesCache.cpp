// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaReferencesCache.h"

#include <vector>

namespace expo {
std::shared_ptr<JavaReferencesCache> JavaReferencesCache::instance() {
  static std::shared_ptr<JavaReferencesCache> singleton{new JavaReferencesCache};
  return singleton;
}

void JavaReferencesCache::loadJClasses(JNIEnv *env) {
  loadJClass(env, "java/lang/Double", {
    {"<init>", "(D)V"}
  });

  loadJClass(env, "java/lang/Boolean", {
    {"<init>", "(Z)V"}
  });

  loadJClass(env, "java/lang/Integer", {
    {"<init>", "(I)V"}
  });

  loadJClass(env, "java/lang/Long", {
    {"<init>", "(J)V"}
  });

  loadJClass(env, "java/lang/Float", {
    {"<init>", "(F)V"}
  });

  loadJClass(env, "com/facebook/react/bridge/PromiseImpl", {
    {"<init>", "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V"}
  });

  loadJClass(env, "expo/modules/kotlin/jni/PromiseImpl", {
    {"<init>", "(Lexpo/modules/kotlin/jni/JavaCallback;Lexpo/modules/kotlin/jni/JavaCallback;)V"}
  });

  loadJClass(env, "java/lang/Object", {});
  loadJClass(env, "java/lang/String", {});
  loadJClass(env, "expo/modules/kotlin/jni/JavaScriptObject", {});
  loadJClass(env, "expo/modules/kotlin/jni/JavaScriptValue", {});
  loadJClass(env, "expo/modules/kotlin/jni/JavaScriptTypedArray", {});
  loadJClass(env, "com/facebook/react/bridge/ReadableNativeArray", {});
  loadJClass(env, "com/facebook/react/bridge/ReadableNativeMap", {});
  loadJClass(env, "com/facebook/react/bridge/WritableNativeArray", {});
  loadJClass(env, "com/facebook/react/bridge/WritableNativeMap", {});
}

void JavaReferencesCache::loadJClass(
  JNIEnv *env,
  const std::string &name,
  const std::vector<std::pair<std::string, std::string>> &methodsNames
) {
  // Note this clazz variable points to a leaked global reference.
  // This is appropriate for classes that are never unloaded which is any class in an Android app.
  auto clazz = (jclass) env->NewGlobalRef(env->FindClass(name.c_str()));

  MethodHashMap methods;
  methods.reserve(methodsNames.size());

  for (auto &method: methodsNames) {
    methods.insert(
      {method, env->GetMethodID(clazz, method.first.c_str(), method.second.c_str())}
    );
  }

  jClassRegistry.insert(
    {name, CachedJClass(clazz, std::move(methods))}
  );
}

JavaReferencesCache::CachedJClass &JavaReferencesCache::getJClass(
  const std::string &className
) {
  return jClassRegistry.at(className);
}

JavaReferencesCache::CachedJClass &JavaReferencesCache::getOrLoadJClass(
  JNIEnv *env,
  const std::string &className
) {
  auto result = jClassRegistry.find(className);
  if (result == jClassRegistry.end()) {
    loadJClass(env, className, {});
    return jClassRegistry.at(className);
  }

  return result->second;
}

jmethodID JavaReferencesCache::CachedJClass::getMethod(
  const std::string &name,
  const std::string &signature
) {
  return methods.at({name, signature});
}

JavaReferencesCache::CachedJClass::CachedJClass(
  jclass clazz,
  MethodHashMap methods
) : clazz(clazz), methods(std::move(methods)) {}
} // namespace expo
