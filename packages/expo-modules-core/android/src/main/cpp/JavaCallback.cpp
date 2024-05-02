// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaCallback.h"
#include "JSIContext.h"
#include "types/JNIToJSIConverter.h"
#include "Exceptions.h"

#include <fbjni/fbjni.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

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
                   makeNativeMethod("invokeNative", JavaCallback::invokeArray),
                   makeNativeMethod("invokeNative", JavaCallback::invokeMap),
                   makeNativeMethod("invokeNative", JavaCallback::invokeSharedRef),
                   makeNativeMethod("invokeNative", JavaCallback::invokeError),
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
  ArgsConverter<T> argsConverter,
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
      jsFunction.call(rt, {jsi::Value(rt, arg)});
    },
    arg
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
  invokeJSFunction<std::string>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      std::string arg
    ) {
      std::optional<jsi::Value> extendedString = convertStringToFollyDynamicIfNeeded(
        rt,
        arg
      );

      if (extendedString.has_value()) {
        const jsi::Value &jsValue = extendedString.value();
        jsFunction.call(
          rt,
          (const jsi::Value *) &jsValue,
          (size_t) 1
        );
        return;
      }

      jsFunction.call(rt, {jsi::String::createFromUtf8(rt, arg)});
    },
    result->toStdString()
  );
}

void JavaCallback::invokeArray(jni::alias_ref<react::WritableNativeArray::javaobject> result) {
  invokeJSFunction<folly::dynamic>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      folly::dynamic arg
    ) {
      jsi::Value convertedArg = jsi::valueFromDynamic(rt, arg);
      auto enhancedArg = decorateValueForDynamicExtension(rt, convertedArg);
      if (enhancedArg) {
        convertedArg = std::move(*enhancedArg);
      }

      jsFunction.call(
        rt,
        (const jsi::Value *) &convertedArg,
        (size_t) 1
      );
    },
    result->cthis()->consume()
  );
}

void JavaCallback::invokeMap(jni::alias_ref<react::WritableNativeMap::javaobject> result) {
  invokeJSFunction<folly::dynamic>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      folly::dynamic arg
    ) {
      jsi::Value convertedArg = jsi::valueFromDynamic(rt, arg);
      auto enhancedArg = decorateValueForDynamicExtension(rt, convertedArg);
      if (enhancedArg) {
        convertedArg = std::move(*enhancedArg);
      }

      jsFunction.call(
        rt,
        (const jsi::Value *) &convertedArg,
        (size_t) 1
      );
    },
    result->cthis()->consume()
  );
}

void JavaCallback::invokeSharedRef(jni::alias_ref<SharedRef::javaobject> result) {
  invokeJSFunction<jni::global_ref<SharedRef::javaobject>>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      jni::global_ref<SharedRef::javaobject> arg
    ) {
      const auto jsiContext = getJSIContext(rt);
      auto native = jni::make_local(arg);

      auto jsClass = jsiContext->getJavascriptClass(native->getClass());
      auto jsObject = jsClass
        ->cthis()
        ->get()
        ->asFunction(rt)
        .callAsConstructor(rt)
        .asObject(rt);

      auto objSharedPtr = std::make_shared<jsi::Object>(std::move(jsObject));
      auto jsObjectInstance = JavaScriptObject::newInstance(
        jsiContext,
        jsiContext->runtimeHolder,
        objSharedPtr
      );
      jni::local_ref<JavaScriptObject::javaobject> jsRef = jni::make_local(
        jsObjectInstance
      );
      jsiContext->registerSharedObject(native, jsRef);

      auto ret = jsi::Value(rt, *objSharedPtr);

      jsFunction.call(
        rt,
        (const jsi::Value *) &ret,
        (size_t) 1
      );
    },
    jni::make_global(result)
  );
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
