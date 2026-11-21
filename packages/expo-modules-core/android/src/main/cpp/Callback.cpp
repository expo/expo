// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#include "Callback.h"
#include "JSIContext.h"
#include "types/JNIToJSIConverter.h"

namespace expo {

Callback::Callback(std::shared_ptr<CallbackContext> callbackContext)
  : callbackContext(std::move(callbackContext)) {}

Callback::~Callback() {
  CallbackContext::schedule(
    callbackContext,
    [](CallbackContext &context) {
      context.invalidate();
    });
}

void Callback::registerNatives() {
  registerHybrid({
                   makeNativeMethod("invokeNative", Callback::invokeNative),
                 });
}

jni::local_ref<Callback::javaobject> Callback::newInstance(
  JSIContext *jsiContext,
  std::shared_ptr<CallbackContext> callbackContext
) {
  auto object = Callback::newObjectCxxArgs(std::move(callbackContext));
  jsiContext->jniDeallocator->addReference(object);
  return object;
}

void Callback::invokeNative(jni::alias_ref<jni::JArrayClass<jobject>> args) {
  auto globalArgs = jni::make_global(args);
  CallbackContext::schedule(
    callbackContext,
    [globalArgs = std::move(globalArgs)](CallbackContext &context) mutable {
      if (!context.resolveHolder.has_value()) {
        return;
      }
      jsi::Runtime &rt = context.rt;
      JNIEnv *env = jni::Environment::current();
      std::vector<jsi::Value> convertedArgs = convertArray(env, rt, globalArgs);
      context.resolveHolder->call(
        rt,
        (const jsi::Value *) convertedArgs.data(),
        convertedArgs.size()
      );
    });
}

} // namespace expo
