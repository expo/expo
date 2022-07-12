// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "CachedReferencesRegistry.h"

#include <utility>

namespace expo {
std::shared_ptr<CachedReferencesRegistry> CachedReferencesRegistry::instance() {
  static std::shared_ptr<CachedReferencesRegistry> singleton{new CachedReferencesRegistry};
  return singleton;
}

void CachedReferencesRegistry::loadJClasses(JNIEnv *env) {
  loadJClass(env, "java/lang/Double", {
    {"<init>", "(D)V"}
  });

  loadJClass(env, "java/lang/Boolean", {
    {"<init>", "(Z)V"}
  });

  loadJClass(env, "com/facebook/react/bridge/PromiseImpl", {
    {"<init>", "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V"}
  });

  loadJClass(env, "java/lang/Object", {});
}

void CachedReferencesRegistry::loadJClass(
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

CachedReferencesRegistry::CachedJClass &CachedReferencesRegistry::getJClass(
  const std::string &className
) {
  return jClassRegistry.at(className);
}

jmethodID CachedReferencesRegistry::CachedJClass::getMethod(const std::string &name,
                                                            const std::string &signature) {
  return methods.at({name, signature});
}

CachedReferencesRegistry::CachedJClass::CachedJClass(
  jclass clazz,
  MethodHashMap methods
) : clazz(clazz), methods(std::move(methods)) {}
} // namespace expo
