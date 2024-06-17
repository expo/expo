// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIUtils.h"
#include "EventEmitter.h"
#include "JSIUtils.h"
#include "types/JNIToJSIConverter.h"

namespace expo {

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
  jni::alias_ref<react::ReadableNativeMap::javaobject> eventBody
) {
  folly::dynamic arg;
  if (eventBody) {
    arg = eventBody->cthis()->consume();
  }

  JNIUtils::emitEventOnJSIObject(
    jsiThis->cthis()->getCachedJSIObject(),
    jsiContextRef,
    eventName,
    [arg = std::move(arg)](jsi::Runtime &rt) -> std::vector<jsi::Value> {
      jsi::Value convertedBody = jsi::valueFromDynamic(rt, arg);
      std::vector<jsi::Value> args;
      args.emplace_back(std::move(convertedBody));
      return args;
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

    jsi::Object jsThis = jsWeakThis->lock(rt).asObject(rt);
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
