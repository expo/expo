// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "RuntimeHolder.h"
#include "JSIContext.h"
#include "JavaScriptModuleObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "JavaScriptWeakObject.h"
#include "JavaScriptFunction.h"
#include "JavaScriptTypedArray.h"
#include "JavaReferencesCache.h"
#include "JavaCallback.h"
#include "JNIUtils.h"
#include "types/FrontendConverterProvider.h"
#include "decorators/JSDecoratorsBridgingObject.h"

#if RN_FABRIC_ENABLED
#include "FabricComponentsRegistry.h"
#endif

#include <jni.h>
#include <fbjni/fbjni.h>

// Install all jni bindings
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    // Loads references to often use Java classes
    expo::JCacheHolder::init(jni::Environment::current());

    expo::FrontendConverterProvider::instance()->createConverters();

#if UNIT_TEST
    expo::RuntimeHolder::registerNatives();
#endif
    expo::JSIContext::registerNatives();
    expo::JavaScriptModuleObject::registerNatives();
    expo::JavaScriptValue::registerNatives();
    expo::JavaScriptObject::registerNatives();
    expo::JavaScriptWeakObject::registerNatives();
    expo::JavaScriptFunction::registerNatives();
    expo::JavaScriptTypedArray::registerNatives();
    expo::JavaCallback::registerNatives();
    expo::JNIUtils::registerNatives();

    // Decorators
    expo::JSDecoratorsBridgingObject::registerNatives();

#if RN_FABRIC_ENABLED
    expo::FabricComponentsRegistry::registerNatives();
#endif
  });
}

JNIEXPORT void JNICALL JNI_OnUnload(JavaVM *vm, void *) {
  JNIEnv *env = nullptr;
  jint ret = vm->GetEnv((void**)env, JNI_VERSION_1_6);
  if (ret != JNI_OK) {
    return;
  }

  expo::JCacheHolder::unLoad(env);
}
