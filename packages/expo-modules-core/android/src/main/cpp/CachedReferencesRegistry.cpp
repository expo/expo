// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "CachedReferencesRegistry.h"

#include <utility>

namespace expo {
std::shared_ptr<JavaCachedReferencesRegistry> JavaCachedReferencesRegistry::instance() {
  static std::shared_ptr<JavaCachedReferencesRegistry> singleton{new JavaCachedReferencesRegistry};
  return singleton;
}

void JavaCachedReferencesRegistry::loadJClasses(JNIEnv *env) {
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

void JavaCachedReferencesRegistry::loadJClass(
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

JavaCachedReferencesRegistry::CachedJClass &JavaCachedReferencesRegistry::getJClass(
  const std::string &className
) {
  return jClassRegistry.at(className);
}

jmethodID JavaCachedReferencesRegistry::CachedJClass::getMethod(const std::string &name,
                                                                const std::string &signature) {
  return methods.at({name, signature});
}

JavaCachedReferencesRegistry::CachedJClass::CachedJClass(
  jclass clazz,
  MethodHashMap methods
) : clazz(clazz), methods(std::move(methods)) {}

JSCachedReferencesRegistry::JSCachedReferencesRegistry(jsi::Runtime &runtime) {
  jsObjectRegistry.emplace(
    JSKeys::PROMISE,
    std::make_unique<jsi::Object>(
      runtime.global().getPropertyAsFunction(runtime, "Promise")
    )
  );

  if (runtime.global().hasProperty(runtime, "ExpoModulesCore_CodedError")) {
    auto jsCodedError = runtime.global()
      .getPropertyAsFunction(runtime, "ExpoModulesCore_CodedError");

    jsObjectRegistry.emplace(
      JSKeys::CODED_ERROR,
      std::make_unique<jsi::Object>(std::move(jsCodedError))
    );
  }
}

jsi::PropNameID &JSCachedReferencesRegistry::getPropNameID(
  jsi::Runtime &runtime,
  const std::string &name
) {
  auto propName = propNameIDRegistry.find(name);
  if (propName == propNameIDRegistry.end()) {
    auto propNameID = std::make_unique<jsi::PropNameID>(jsi::PropNameID::forAscii(runtime, name));
    auto[result, _] = propNameIDRegistry.emplace(name, std::move(propNameID));
    return *result->second;
  }

  return *propName->second;
}
} // namespace expo
