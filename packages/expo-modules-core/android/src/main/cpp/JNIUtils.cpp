// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIUtils.h"
#include "EventEmitter.h"
#include "JSIUtils.h"
#include "types/JNIToJSIConverter.h"
#include <jsi/JSIDynamic.h>
#include "JSIContext.h"

namespace expo {

jsi::Value convertSharedObject(
  jni::local_ref<JSharedObject::javaobject> sharedObject,
  jsi::Runtime &rt,
  JSIContext *jsiContext
) {
  int id = sharedObject->getId();
  if (id != 0) {
    return jsi::Value(rt, *jsiContext->getSharedObject(id)->cthis()->get());
  }

  auto jsClass = jsiContext->getJavascriptClass(sharedObject->getClass());
  if (jsClass == nullptr) {
    // If the shared object is an instance of `ShareRef` and the class was not found,
    // we can create a new JavaScript object with the empty prototype.
    // User didn't register SharedRef using Class component.
    if (sharedObject->isInstanceOf(JSharedRef::javaClassStatic())) {
      auto jsObject = std::make_shared<jsi::Object>(jsi::Object(rt));
      auto jsObjectRef = JavaScriptObject::newInstance(
        jsiContext,
        jsiContext->runtimeHolder,
        jsObject
      );
      jsiContext->registerSharedObject(sharedObject, jsObjectRef);
      return jsi::Value(rt, *jsObject);
    }

    throwNewJavaException(
      UnexpectedException::create(
        "Could not find JavaScript class for shared object: " + sharedObject->toString()
      ).get()
    );

  }
  auto prototype = jsClass
    ->cthis()
    ->get()
    ->getProperty(rt, "prototype")
    .asObject(rt);

  auto objSharedPtr = std::make_shared<jsi::Object>(
    expo::common::createObjectWithPrototype(rt, &prototype)
  );
  auto jsObjectInstance = JavaScriptObject::newInstance(
    jsiContext,
    jsiContext->runtimeHolder,
    objSharedPtr
  );
  jni::local_ref<JavaScriptObject::javaobject> jsRef = jni::make_local(
    jsObjectInstance
  );
  jsiContext->registerSharedObject(sharedObject, jsRef);

  return jsi::Value(rt, *objSharedPtr);
}

void JNIUtils::registerNatives() {
  javaClassStatic()->registerNatives({
                                       makeNativeMethod("emitEvent",
                                                        JNIUtils::emitEventOnJavaScriptObject),
                                       makeNativeMethod("emitEvent",
                                                        JNIUtils::emitEventOnJavaScriptModule),
                                       makeNativeMethod("emitEvent",
                                                        JNIUtils::emitEventOnWeakJavaScriptObject)
                                     });
}

void JNIUtils::emitEventOnWeakJavaScriptObject(
  [[maybe_unused]] jni::alias_ref<jni::JClass> clazz,
  jni::alias_ref<JavaScriptWeakObject::javaobject> jsiThis,
  jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
  jni::alias_ref<jstring> eventName,
  jni::alias_ref<jni::JArrayClass<jobject>> args
) {
  jni::global_ref<jni::JArrayClass<jobject>> globalArgs = jni::make_global(args);

  JNIUtils::emitEventOnJSIObject(
    jsiThis->cthis()->getWeak(),
    jsiContextRef,
    eventName,
    [args = globalArgs](jsi::Runtime &rt) -> std::vector<jsi::Value> {
      auto localArgs = jni::static_ref_cast<jni::JArrayClass<jobject>>(args);

      JNIEnv *env = jni::Environment::current();

      size_t size = localArgs->size();
      std::vector<jsi::Value> convertedArgs;
      convertedArgs.reserve(size);

      for (size_t i = 0; i < size; i++) {
        jni::local_ref<jobject> arg = localArgs->getElement(i);
        convertedArgs.push_back(convert(env, rt, std::move(arg)));
      }

      return convertedArgs;
    }
  );
}

void JNIUtils::emitEventOnJavaScriptObject(
  [[maybe_unused]] jni::alias_ref<jni::JClass> clazz,
  jni::alias_ref<JavaScriptObject::javaobject> jsiThis,
  jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
  jni::alias_ref<jstring> eventName,
  jni::alias_ref<jni::JArrayClass<jobject>> args
) {
  jni::global_ref<jni::JArrayClass<jobject>> globalArgs = jni::make_global(args);

  JNIUtils::emitEventOnJSIObject(
    jsiThis->cthis()->get(),
    jsiContextRef,
    eventName,
    [args = globalArgs](jsi::Runtime &rt) -> std::vector<jsi::Value> {
      auto localArgs = jni::static_ref_cast<jni::JArrayClass<jobject>>(args);

      JNIEnv *env = jni::Environment::current();

      size_t size = localArgs->size();
      std::vector<jsi::Value> convertedArgs;
      convertedArgs.reserve(size);

      for (size_t i = 0; i < size; i++) {
        jni::local_ref<jobject> arg = localArgs->getElement(i);
        convertedArgs.push_back(convert(env, rt, std::move(arg)));
      }

      return convertedArgs;
    }
  );
}

void JNIUtils::emitEventOnJavaScriptModule(
  [[maybe_unused]] jni::alias_ref<jni::JClass> clazz,
  jni::alias_ref<JavaScriptModuleObject::javaobject> jsiThis,
  jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
  jni::alias_ref<jstring> eventName,
  jni::alias_ref<jni::JMap<jstring, jobject>> eventBody
) {
  auto globalEventBody = jni::make_global(eventBody);

  JNIUtils::emitEventOnJSIObject(
    jsiThis->cthis()->getCachedJSIObject(),
    jsiContextRef,
    eventName,
    [args = std::move(globalEventBody)](jsi::Runtime &rt) -> std::vector<jsi::Value> {
      JNIEnv *env = jni::Environment::current();

      auto localArgs = jni::static_ref_cast<jni::JMap<jstring, jobject>>(args);
      std::vector<jsi::Value> result;
      result.push_back(convertToJS(env, rt, localArgs));
      return result;
    }
  );
}

void JNIUtils::emitEventOnJSIObject(
  std::weak_ptr<jsi::WeakObject> jsiThis,
  jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
  jni::alias_ref<jstring> eventName,
  ArgsProvider argsProvider
) {
  const std::string name = eventName->toStdString();

  const JSIContext *jsiContext = jsiContextRef->cthis();

  jsiContext->runtimeHolder->jsInvoker->invokeAsync([
                                                      jsiContext,
                                                      name = std::move(name),
                                                      argsProvider = std::move(argsProvider),
                                                      weakThis = std::move(jsiThis)
                                                    ]() {
    std::shared_ptr<jsi::WeakObject> jsWeakThis = weakThis.lock();
    if (!jsWeakThis) {
      return;
    }

    // TODO(@lukmccall): refactor when jsInvoker receives a runtime as a parameter
    jsi::Runtime &rt = jsiContext->runtimeHolder->get();

    jsi::Value unpackedValue = jsWeakThis->lock(rt);
    if (unpackedValue.isUndefined()) {
      // The JS object was deallocated - we can ignore emitting an event
      return;
    }

    jsi::Object jsThis = unpackedValue.asObject(rt);
    EventEmitter::emitEvent(rt, jsThis, name, argsProvider(rt));
  });
}

void JNIUtils::emitEventOnJSIObject(
  std::weak_ptr<jsi::Object> jsiThis,
  jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
  jni::alias_ref<jstring> eventName,
  ArgsProvider argsProvider
) {
  const std::string name = eventName->toStdString();

  const JSIContext *jsiContext = jsiContextRef->cthis();

  jsiContext->runtimeHolder->jsInvoker->invokeAsync([
                                                      jsiContext,
                                                      name = std::move(name),
                                                      weakThis = std::move(jsiThis),
                                                      argsProvider = std::move(argsProvider)
                                                    ]() {
    std::shared_ptr<jsi::Object> jsThis = weakThis.lock();
    if (!jsThis) {
      return;
    }

    // TODO(@lukmccall): refactor when jsInvoker receives a runtime as a parameter
    jsi::Runtime &rt = jsiContext->runtimeHolder->get();

    EventEmitter::emitEvent(rt, *jsThis, name, argsProvider(rt));
  });
}
} // namespace expo
