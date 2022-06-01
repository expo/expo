// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIInteropModuleRegistry.h"
#include "JavaScriptModuleObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"

#include <jni.h>
#include <fbjni/fbjni.h>

// Install all jni bindings
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    expo::JSIInteropModuleRegistry::registerNatives();
    expo::JavaScriptModuleObject::registerNatives();
    expo::JavaScriptValue::registerNatives();
    expo::JavaScriptObject::registerNatives();
  });
}
