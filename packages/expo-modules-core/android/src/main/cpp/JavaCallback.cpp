// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaCallback.h"
#include "JSIContext.h"
#include "types/JNIToJSIConverter.h"
#include "Exceptions.h"

#include "JSIUtils.h"
#include "JNIUtils.h"

#include <fbjni/fbjni.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>

#include <functional>

namespace expo {

#if REACT_NATIVE_TARGET_VERSION >= 75

JavaCallback::CallbackContext::CallbackContext(
  jsi::Runtime &rt,
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
  std::optional<jsi::Function> resolveHolder,
  std::optional<jsi::Function> rejectHolder
) : react::LongLivedObject(rt),
    rt(rt),
    jsCallInvokerHolder(std::move(jsCallInvokerHolder)),
    resolveHolder(std::move(resolveHolder)),
    rejectHolder(std::move(rejectHolder)) {}

#else

JavaCallback::CallbackContext::CallbackContext(
  jsi::Runtime &rt,
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
  std::optional<jsi::Function> resolveHolder,
  std::optional<jsi::Function> rejectHolder
) : rt(rt),
    jsCallInvokerHolder(std::move(jsCallInvokerHolder)),
    resolveHolder(std::move(resolveHolder)),
    rejectHolder(std::move(rejectHolder)) {}

#endif

void JavaCallback::CallbackContext::invalidate() {
  resolveHolder.reset();
  rejectHolder.reset();
  allowRelease();
}

JavaCallback::JavaCallback(std::shared_ptr<CallbackContext> callbackContext)
  : callbackContext(std::move(callbackContext)) {}

void JavaCallback::registerNatives() {
  registerHybrid({
                   makeNativeMethod("invokeNative", JavaCallback::invoke),
                   makeNativeMethod("invokeNative", JavaCallback::invokeBool),
                   makeNativeMethod("invokeNative", JavaCallback::invokeInt),
                   makeNativeMethod("invokeNative", JavaCallback::invokeDouble),
                   makeNativeMethod("invokeNative", JavaCallback::invokeFloat),
                   makeNativeMethod("invokeNative", JavaCallback::invokeString),
                   makeNativeMethod("invokeNative", JavaCallback::invokeCollection),
                   makeNativeMethod("invokeNative", JavaCallback::invokeMap),
                   makeNativeMethod("invokeNative", JavaCallback::invokeWritableArray),
                   makeNativeMethod("invokeNative", JavaCallback::invokeWritableMap),
                   makeNativeMethod("invokeNative", JavaCallback::invokeSharedObject),
                   makeNativeMethod("invokeNative", JavaCallback::invokeError),
                   makeNativeMethod("invokeIntArray", JavaCallback::invokeIntArray),
                   makeNativeMethod("invokeLongArray", JavaCallback::invokeLongArray),
                   makeNativeMethod("invokeFloatArray", JavaCallback::invokeFloatArray),
                   makeNativeMethod("invokeDoubleArray", JavaCallback::invokeDoubleArray),
                 });
}


jni::local_ref<JavaCallback::javaobject> JavaCallback::newInstance(
  JSIContext *jsiContext,
  std::shared_ptr<CallbackContext> callbackContext
) {
  auto object = JavaCallback::newObjectCxxArgs(std::move(callbackContext));
  jsiContext->jniDeallocator->addReference(object);
  return object;
}

template<typename T>
void JavaCallback::invokeJSFunction(
  ArgsConverter<typename std::remove_const<T>::type> argsConverter,
  T arg
) {
  const auto strongCallbackContext = this->callbackContext.lock();
  // The context were deallocated before the callback was invoked.
  if (strongCallbackContext == nullptr) {
    return;
  }

  const auto jsInvoker = strongCallbackContext->jsCallInvokerHolder.lock();
  // Call invoker is already released, so we cannot invoke the callback.
  if (jsInvoker == nullptr) {
    return;
  }

  jsInvoker->invokeAsync(
    [
      context = callbackContext,
      argsConverter = std::move(argsConverter),
      arg = std::move(arg)
    ]() -> void {
      auto strongContext = context.lock();
      // The context were deallocated before the callback was invoked.
      if (strongContext == nullptr) {
        return;
      }

      if (!strongContext->resolveHolder.has_value()) {
        throw std::runtime_error(
          "JavaCallback was already settled. Cannot invoke it again"
        );
      }

      jsi::Function &jsFunction = strongContext->resolveHolder.value();
      jsi::Runtime &rt = strongContext->rt;

      argsConverter(rt, jsFunction, std::move(arg));
      strongContext->invalidate();
    });
}

template<class T>
void JavaCallback::invokeJSFunction(T arg) {
  invokeJSFunction<T>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      T arg
    ) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::forward<T>(arg)));
    },
    arg
  );
}

template<class T>
void JavaCallback::invokeJSFunctionForArray(T &arg) {
  size_t size = arg->size();
  auto region = arg->getRegion((jsize) 0, size);
  RawArray<typename decltype(region)::element_type> rawArray;
  rawArray.size = size;
  rawArray.data = std::move(region);

  invokeJSFunction<decltype(rawArray)>(
    std::move(rawArray)
  );
}

void JavaCallback::invoke() {
  invokeJSFunction<nullptr_t>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      nullptr_t arg
    ) {
      jsFunction.call(rt, {jsi::Value::null()});
    },
    nullptr
  );
}

void JavaCallback::invokeBool(bool result) {
  invokeJSFunction(result);
}

void JavaCallback::invokeInt(int result) {
  invokeJSFunction(result);
}

void JavaCallback::invokeDouble(double result) {
  invokeJSFunction(result);
}

void JavaCallback::invokeFloat(float result) {
  invokeJSFunction(result);
}

void JavaCallback::invokeString(jni::alias_ref<jstring> result) {
  invokeJSFunction(result->toStdString());
}

void JavaCallback::invokeCollection(jni::alias_ref<jni::JCollection<jobject>> result) {
  invokeJSFunction<
    jni::global_ref<jni::JCollection<jobject>>
  >(jni::make_global(result));
}

void JavaCallback::invokeMap(jni::alias_ref<jni::JMap<jstring, jobject>> result) {
  invokeJSFunction<
    jni::global_ref<jni::JMap<jstring, jobject>>
  >(jni::make_global(result));
}

void
JavaCallback::invokeWritableArray(jni::alias_ref<react::WritableNativeArray::javaobject> result) {
  invokeJSFunction(result->cthis()->consume());
}

void JavaCallback::invokeWritableMap(jni::alias_ref<react::WritableNativeMap::javaobject> result) {
  invokeJSFunction(result->cthis()->consume());
}

void JavaCallback::invokeSharedObject(jni::alias_ref<JSharedObject::javaobject> result) {
  invokeJSFunction(jni::make_global(result));
}

void JavaCallback::invokeIntArray(jni::alias_ref<jni::JArrayInt> result) {
  invokeJSFunctionForArray(result);
}

void JavaCallback::invokeLongArray(jni::alias_ref<jni::JArrayLong> result) {
  invokeJSFunctionForArray(result);
}

void JavaCallback::invokeDoubleArray(jni::alias_ref<jni::JArrayDouble> result) {
  invokeJSFunctionForArray(result);
}

void JavaCallback::invokeFloatArray(jni::alias_ref<jni::JArrayFloat> result) {
  invokeJSFunctionForArray(result);
}

void JavaCallback::invokeError(jni::alias_ref<jstring> code, jni::alias_ref<jstring> errorMessage) {
  const auto strongCallbackContext = this->callbackContext.lock();
  // The context were deallocated before the callback was invoked.
  if (strongCallbackContext == nullptr) {
    return;
  }

  const auto jsInvoker = strongCallbackContext->jsCallInvokerHolder.lock();
  // Call invoker is already released, so we cannot invoke the callback.
  if (jsInvoker == nullptr) {
    return;
  }

  jsInvoker->invokeAsync(
    [
      context = callbackContext,
      code = code->toStdString(),
      errorMessage = errorMessage->toStdString()
    ]() -> void {
      auto strongContext = context.lock();
      // The context were deallocated before the callback was invoked.
      if (strongContext == nullptr) {
        return;
      }

      if (!strongContext->rejectHolder.has_value()) {
        throw std::runtime_error(
          "JavaCallback was already settled. Cannot invoke it again"
        );
      }

      jsi::Function &jsFunction = strongContext->rejectHolder.value();
      jsi::Runtime &rt = strongContext->rt;

      auto codedError = makeCodedError(
        rt,
        jsi::String::createFromUtf8(rt, code),
        jsi::String::createFromUtf8(rt, errorMessage)
      );

      jsFunction.call(
        rt,
        (const jsi::Value *) &codedError,
        (size_t) 1
      );

      strongContext->invalidate();
    });
}
} // namespace expo
