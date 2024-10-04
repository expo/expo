// Copyright 2015-present 650 Industries. All rights reserved.

#include "JavaScriptWeakObject.h"
#include "JSIInteropModuleRegistry.h"

namespace expo {

void JavaScriptWeakObject::registerNatives() {
  registerHybrid({
      makeNativeMethod("lock", JavaScriptWeakObject::lock),
  });
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptWeakObject::lock() {
  jsi::Runtime &rt = _runtimeHolder.getJSRuntime();

  jsi::Value value = _weakObject->lock(rt);
  if (value.isUndefined()) {
    return nullptr;
  }
  std::shared_ptr<jsi::Object> objectPtr =
      std::make_shared<jsi::Object>(value.asObject(rt));
  if (!objectPtr) {
    return nullptr;
  }
  return JavaScriptObject::newInstance(_runtimeHolder.getModuleRegistry(),
                                       _runtimeHolder, objectPtr);
}

jni::local_ref<jni::HybridClass<JavaScriptWeakObject, Destructible>::javaobject>
JavaScriptWeakObject::newInstance(
    JSIInteropModuleRegistry *jsiInteropModuleRegistry,
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject) {
  auto weakObject = JavaScriptWeakObject::newObjectCxxArgs(std::move(runtime),
                                                           std::move(jsObject));
  jsiInteropModuleRegistry->jniDeallocator->addReference(weakObject);
  return weakObject;
}

JavaScriptWeakObject::JavaScriptWeakObject(
    WeakRuntimeHolder runtime, std::shared_ptr<jsi::Object> jsObject)
    : _runtimeHolder(std::move(runtime)) {
  _runtimeHolder.ensureRuntimeIsValid();
  jsi::Runtime &rt = _runtimeHolder.getJSRuntime();
  _weakObject = std::make_shared<jsi::WeakObject>(rt, *jsObject);
}

} // namespace expo
