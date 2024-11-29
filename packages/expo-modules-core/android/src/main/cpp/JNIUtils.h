// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <vector>
#include <functional>

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>

#include "JSIContext.h"
#include "JavaScriptObject.h"
#include "JavaScriptModuleObject.h"
#include "JavaScriptWeakObject.h"
#include "JSharedObject.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

class JSIContext;

jsi::Value convertSharedObject(
  jni::local_ref<JSharedObject::javaobject> sharedObject,
  jsi::Runtime &rt,
  JSIContext *context
);

class JNIUtils : public jni::JavaClass<JNIUtils> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/JNIUtils;";
  static auto constexpr TAG = "JNIUtils";

  static void registerNatives();

  static void emitEventOnWeakJavaScriptObject(
    jni::alias_ref<jni::JClass> clazz,
    jni::alias_ref<JavaScriptWeakObject::javaobject> jsiThis,
    jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
    jni::alias_ref<jstring> eventName,
    jni::alias_ref<jni::JArrayClass<jobject>> args
  );

  static void emitEventOnJavaScriptObject(
    jni::alias_ref<jni::JClass> clazz,
    jni::alias_ref<JavaScriptObject::javaobject> jsiThis,
    jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
    jni::alias_ref<jstring> eventName,
    jni::alias_ref<jni::JArrayClass<jobject>> args
  );

  static void emitEventOnJavaScriptModule(
    jni::alias_ref<jni::JClass> clazz,
    jni::alias_ref<JavaScriptModuleObject::javaobject> jsiThis,
    jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
    jni::alias_ref<jstring> eventName,
    jni::alias_ref<jni::JMap<jstring, jobject>> eventBody
  );

private:
  using ArgsProvider = std::function<std::vector<jsi::Value>(jsi::Runtime &rt)>;

  static void emitEventOnJSIObject(
    std::weak_ptr<jsi::Object> jsiThis,
    jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
    jni::alias_ref<jstring> eventName,
    ArgsProvider argsProvider
  );

  static void emitEventOnJSIObject(
    std::weak_ptr<jsi::WeakObject> jsiThis,
    jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
    jni::alias_ref<jstring> eventName,
    ArgsProvider argsProvider
  );
};

} // namespace expo
