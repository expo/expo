// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#include "Callback.h"
#include "JSIContext.h"
#include "types/JNIToJSIConverter.h"

namespace expo {

Callback::Callback(std::shared_ptr<CallbackContext> callbackContext)
  : callbackContext(std::move(callbackContext)) {}

Callback::~Callback() {
  // The JS function may only be released on the JS thread while the runtime is alive, so post the
  // release there. `invalidate` drops the function and calls `allowRelease`, which lets the
  // runtime's `LongLivedObjectCollection` forget the context. When the invoker is already gone the
  // post is a no-op: the teardown sweep has released the context already.
  scheduleOnJSThread(
    callbackContext,
    [](jsi::Runtime &, CallbackContext &context) {
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
  // The JNI array must outlive this call because conversion happens on the JS thread.
  auto globalArgs = jni::make_global(args);
  scheduleOnJSThread(
    callbackContext,
    [globalArgs = std::move(globalArgs)](jsi::Runtime &rt, CallbackContext &context) mutable {
      if (!context.resolveHolder.has_value()) {
        return;
      }
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
