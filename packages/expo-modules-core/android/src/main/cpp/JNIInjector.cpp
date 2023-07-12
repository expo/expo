// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIInteropModuleRegistry.h"
#include "JavaScriptModuleObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "JavaScriptFunction.h"
#include "JavaScriptTypedArray.h"
#include "JavaReferencesCache.h"
#include "JavaCallback.h"
#include "types/FrontendConverterProvider.h"

#if RN_FABRIC_ENABLED
#include "FabricComponentsRegistry.h"
#endif

#include <jni.h>
#include <fbjni/fbjni.h>

// Install all jni bindings
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    // Loads references to often use Java classes
    expo::JavaReferencesCache::instance()->loadJClasses(jni::Environment::current());
    expo::FrontendConverterProvider::instance()->createConverters();

    expo::JSIInteropModuleRegistry::registerNatives();
    expo::JavaScriptModuleObject::registerNatives();
    expo::JavaScriptValue::registerNatives();
    expo::JavaScriptObject::registerNatives();
    expo::JavaScriptFunction::registerNatives();
    expo::JavaScriptTypedArray::registerNatives();
    expo::JavaCallback::registerNatives();
#if RN_FABRIC_ENABLED
    expo::FabricComponentsRegistry::registerNatives();
#endif
  });
}
