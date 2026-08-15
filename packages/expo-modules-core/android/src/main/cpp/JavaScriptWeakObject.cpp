// Copyright 2015-present 650 Industries. All rights reserved.

#include "JavaScriptWeakObject.h"
#include "JSIContext.h"

namespace expo {

void JavaScriptWeakObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("lock", JavaScriptWeakObject::lock),
                 });
}

std::shared_ptr<jsi::WeakObject> JavaScriptWeakObject::getWeak() {
  return _weakObject;
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptWeakObject::lock() {
  auto jsRuntime = _runtimeHolder.lock();
  assert((jsRuntime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = jsRuntime->get();

  jsi::Value value = _weakObject->lock(rawRuntime);
  if (value.isUndefined()) {
    return nullptr;
  }
  std::shared_ptr<jsi::Object> objectPtr =
    std::make_shared<jsi::Object>(value.asObject(rawRuntime));
  if (!objectPtr) {
    return nullptr;
  }
  return JavaScriptObject::newInstance(
    expo::getJSIContext(rawRuntime),
    _runtimeHolder, objectPtr
  );
}

jni::local_ref<jni::HybridClass<JavaScriptWeakObject, Destructible>::javaobject>
JavaScriptWeakObject::newInstance(
  JSIContext *jSIContext,
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Object> jsObject) {
  auto weakObject = JavaScriptWeakObject::newObjectCxxArgs(std::move(runtime),
                                                           std::move(jsObject));
  jSIContext->jniDeallocator->addReference(weakObject);
  return weakObject;
}

JavaScriptWeakObject::JavaScriptWeakObject(
  const std::weak_ptr<JavaScriptRuntime> &runtime,
  const std::shared_ptr<jsi::Object> &jsObject
) : _runtimeHolder(std::move(runtime)) {
  auto jsRuntime = _runtimeHolder.lock();
  assert((jsRuntime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = jsRuntime->get();

  _weakObject = std::make_shared<jsi::WeakObject>(rawRuntime, *jsObject);
}

} // namespace expo
