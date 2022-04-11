// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "MethodMetadata.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeArray.h>

#include <map>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
class JavaScriptModuleObject : public jni::HybridClass<JavaScriptModuleObject> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptModuleObject;";
  static auto constexpr TAG = "JavaScriptModuleObject";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  /**
   * Returns a cached instance of jsi::Object representing this module.
   * @param runtime
   * @return Wrapped instance of JavaScriptModuleObject::HostObject
   */
  std::shared_ptr<jsi::Object> getJSIObject(jsi::Runtime &runtime);

  /**
   * Registers a sync function.
   * That function can be called via the `JavaScriptModuleObject.callSyncMethod` method.
   */
  void registerSyncFunction(jni::alias_ref<jstring> name, jint args);

  class HostObject : public jsi::HostObject {
  public:
    HostObject(JavaScriptModuleObject *);

    jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

    void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

  private:
    JavaScriptModuleObject *jsModule;
  };

private:
  friend HybridBase;
  std::shared_ptr<jsi::Object> jsiObject = nullptr;
  jni::global_ref<JavaScriptModuleObject::javaobject> javaPart_;

  /**
   * Metadata map that stores information about all available methods on this module.
   */
  std::map<std::string, MethodMetadata> methodsMetadata;

  inline jni::local_ref<react::ReadableNativeArray::javaobject>
  callSyncMethod(jni::local_ref<jstring> &&name, react::ReadableNativeArray::javaobject &&args);

  explicit JavaScriptModuleObject(jni::alias_ref<jhybridobject> jThis)
    : javaPart_(jni::make_global(jThis)) {}
};
} // namespace expo
