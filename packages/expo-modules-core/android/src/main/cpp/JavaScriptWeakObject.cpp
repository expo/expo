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

  std::shared_ptr<jsi::Object> objectPtr;
  if (_weakObjectType == WeakObjectType::JSIWeakObject) {
    jsi::Value value =
        std::static_pointer_cast<jsi::WeakObject>(_weakObject)->lock(rt);
    if (value.isUndefined()) {
      return nullptr;
    }
    objectPtr = std::make_shared<jsi::Object>(value.asObject(rt));
  } else if (_weakObjectType == WeakObjectType::WeakRef) {
    objectPtr =
        derefWeakRef(rt, std::static_pointer_cast<jsi::Object>(_weakObject));
  } else {
    objectPtr = std::static_pointer_cast<jsi::Object>(_weakObject);
  }

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

  try {
    _weakObject = std::make_shared<jsi::WeakObject>(rt, *jsObject);
    _weakObjectType = WeakObjectType::JSIWeakObject;
    return;
  } catch (const std::logic_error &) {
    // JSCRuntime will throw std::logic_error from unimplemented jsi::WeakObject
  }

  // Check whether the runtime supports `WeakRef` objects. If it does not,
  // we consciously hold a strong reference to the object and cause memory
  // leaks.
  if (isWeakRefSupported(rt)) {
    _weakObject = createWeakRef(rt, jsObject);
    _weakObjectType = WeakObjectType::WeakRef;
  } else {
    _weakObject = jsObject;
    _weakObjectType = WeakObjectType::NotSupported;
  }
}

// #region WeakRef runtime helpers (fallback when jsi::WeakObject is not
// available).

// static
bool JavaScriptWeakObject::isWeakRefSupported(jsi::Runtime &runtime) {
  return runtime.global().hasProperty(runtime, "WeakRef");
}

// static
std::shared_ptr<jsi::Object>
JavaScriptWeakObject::createWeakRef(jsi::Runtime &runtime,
                                    std::shared_ptr<jsi::Object> object) {
  jsi::Object weakRef =
      runtime.global()
          .getProperty(runtime, "WeakRef")
          .asObject(runtime)
          .asFunction(runtime)
          .callAsConstructor(runtime, jsi::Value(runtime, *object))
          .asObject(runtime);
  return std::make_shared<jsi::Object>(std::move(weakRef));
}

// static
std::shared_ptr<jsi::Object>
JavaScriptWeakObject::derefWeakRef(jsi::Runtime &runtime,
                                   std::shared_ptr<jsi::Object> object) {
  jsi::Value ref = object->getProperty(runtime, "deref")
                       .asObject(runtime)
                       .asFunction(runtime)
                       .callWithThis(runtime, *object);

  if (ref.isUndefined()) {
    return nullptr;
  }
  return std::make_shared<jsi::Object>(ref.asObject(runtime));
}

// #endregion

} // namespace expo
