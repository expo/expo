// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSCallback.h"
#include "JSIContext.h"
#include "types/JNIToJSIConverter.h"

#include <fbjni/fbjni.h>

namespace expo {

JSCallback::CallbackContext::CallbackContext(
  jsi::Runtime &rt,
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
  std::shared_ptr<jsi::Function> jsFunction
) : react::LongLivedObject(rt),
    rt(rt),
    jsCallInvokerHolder(std::move(jsCallInvokerHolder)),
    jsFunction(std::move(jsFunction)) {}

void JSCallback::CallbackContext::release() {
  allowRelease();
}

JSCallback::JSCallback(const std::shared_ptr<CallbackContext>& callbackContext)
  : callbackContext(callbackContext) {}

JSCallback::~JSCallback() {
  if (auto ctx = callbackContext.lock()) {
    ctx->release();
  }
}

void JSCallback::registerNatives() {
  registerHybrid({
                   makeNativeMethod("invokeNative", JSCallback::invoke),
                   makeNativeMethod("invokeNative", JSCallback::invokeBool),
                   makeNativeMethod("invokeNative", JSCallback::invokeInt),
                   makeNativeMethod("invokeNative", JSCallback::invokeDouble),
                   makeNativeMethod("invokeNative", JSCallback::invokeFloat),
                   makeNativeMethod("invokeNative", JSCallback::invokeString),
                   makeNativeMethod("invokeNative", JSCallback::invokeCollection),
                   makeNativeMethod("invokeNative", JSCallback::invokeMap),
                   makeNativeMethod("invokeIntArray", JSCallback::invokeIntArray),
                   makeNativeMethod("invokeLongArray", JSCallback::invokeLongArray),
                   makeNativeMethod("invokeFloatArray", JSCallback::invokeFloatArray),
                   makeNativeMethod("invokeDoubleArray", JSCallback::invokeDoubleArray),
                 });
}

jni::local_ref<JSCallback::javaobject> JSCallback::newInstance(
  JSIContext *jsiContext,
  const std::shared_ptr<CallbackContext>& callbackContext
) {
  auto object = JSCallback::newObjectCxxArgs(callbackContext);
  jsiContext->jniDeallocator->addReference(object);
  return object;
}

template<class T>
void JSCallback::invokeJSFunction(
  ArgsConverter<typename std::remove_const<T>::type> argsConverter,
  T arg
) {
  auto strong = callbackContext.lock();
  if (!strong) return;

  auto jsInvoker = strong->jsCallInvokerHolder.lock();
  if (!jsInvoker) return;

  jsInvoker->invokeAsync(
    [
      context = callbackContext,
      argsConverter = std::move(argsConverter),
      arg = std::move(arg)
    ]() -> void {
      auto strongContext = context.lock();
      if (!strongContext || !strongContext->jsFunction) return;

      jsi::Function &jsFunction = *strongContext->jsFunction;
      jsi::Runtime &rt = strongContext->rt;

      argsConverter(rt, jsFunction, std::move(arg));
    });
}

template<class T>
void JSCallback::invokeJSFunction(T arg) {
  invokeJSFunction<T>(
    [](jsi::Runtime &rt, jsi::Function &jsFunction, T arg) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::forward<T>(arg)));
    },
    arg
  );
}

template<class T>
void JSCallback::invokeJSFunctionForArray(T &arg) {
  size_t size = arg->size();
  auto region = arg->getRegion((jsize) 0, size);
  RawArray<typename decltype(region)::element_type> rawArray;
  rawArray.size = size;
  rawArray.data = std::move(region);

  invokeJSFunction<decltype(rawArray)>(
    std::move(rawArray)
  );
}

void JSCallback::invoke() {
  invokeJSFunction<nullptr_t>(
    [](jsi::Runtime &rt, jsi::Function &jsFunction, nullptr_t) {
      jsFunction.call(rt);
    },
    nullptr
  );
}

void JSCallback::invokeBool(bool result) {
  invokeJSFunction(result);
}

void JSCallback::invokeInt(int result) {
  invokeJSFunction(result);
}

void JSCallback::invokeDouble(double result) {
  invokeJSFunction(result);
}

void JSCallback::invokeFloat(float result) {
  invokeJSFunction(result);
}

void JSCallback::invokeString(jni::alias_ref<jstring> result) {
  invokeJSFunction(result->toStdString());
}

void JSCallback::invokeCollection(const jni::alias_ref<jni::JCollection<jobject>>& result) {
  invokeJSFunction<
    jni::global_ref<jni::JCollection<jobject>>
  >(jni::make_global(result));
}

void JSCallback::invokeMap(const jni::alias_ref<jni::JMap<jstring, jobject>>& result) {
  invokeJSFunction<
    jni::global_ref<jni::JMap<jstring, jobject>>
  >(jni::make_global(result));
}

void JSCallback::invokeIntArray(jni::alias_ref<jni::JArrayInt> result) {
  invokeJSFunctionForArray(result);
}

void JSCallback::invokeLongArray(jni::alias_ref<jni::JArrayLong> result) {
  invokeJSFunctionForArray(result);
}

void JSCallback::invokeDoubleArray(jni::alias_ref<jni::JArrayDouble> result) {
  invokeJSFunctionForArray(result);
}

void JSCallback::invokeFloatArray(jni::alias_ref<jni::JArrayFloat> result) {
  invokeJSFunctionForArray(result);
}

} // namespace expo
