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

JavaCallback::JavaCallback(std::shared_ptr<CallbackContext> callbackContext)
  : callbackContext(std::move(callbackContext)) {}

void JavaCallback::registerNatives() {
  registerHybrid({
                   makeNativeMethod("invoke", JavaCallback::invoke),
                   makeNativeMethod("invoke", JavaCallback::invokeBool),
                   makeNativeMethod("invoke", JavaCallback::invokeInt),
                   makeNativeMethod("invoke", JavaCallback::invokeDouble),
                   makeNativeMethod("invoke", JavaCallback::invokeFloat),
                   makeNativeMethod("invoke", JavaCallback::invokeString),
                   makeNativeMethod("invoke", JavaCallback::invokeArray),
                   makeNativeMethod("invoke", JavaCallback::invokeMap),
                   makeNativeMethod("invoke", JavaCallback::invokeSharedRef),
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
  const auto jsInvoker = callbackContext->jsCallInvokerHolder;
  jsInvoker->invokeAsync(
    [
      context = std::move(callbackContext),
      argsConverter = std::move(argsConverter),
      arg = std::move(arg)
    ]() -> void {
      if (!context->jsFunctionHolder.has_value()) {
        throw std::runtime_error(
          "JavaCallback was already settled. Cannot invoke it again"
        );
        return;
      }

      jsi::Function &jsFunction = context->jsFunctionHolder.value();
      jsi::Runtime &rt = context->rt;

      argsConverter(rt, jsFunction, std::move(arg), context->isRejectCallback);
      context->jsFunctionHolder.reset();
    });
}

template<class T>
void JavaCallback::invokeJSFunction(T arg) {
  invokeJSFunction<T>(
    [](
      jsi::Runtime &rt,
      jsi::Function &jsFunction,
      T arg,
      bool isRejectCallback
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
      nullptr_t arg,
      bool isRejectCallback
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
      std::string arg,
      bool isRejectCallback
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
      folly::dynamic arg,
      bool isRejectCallback
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
      folly::dynamic arg,
      bool isRejectCallback
    ) {
      if (isRejectCallback) {
        auto errorCode = arg.find("code")->second.asString();
        auto message = arg.find("message")->second.asString();

        auto codedError = makeCodedError(
          rt,
          jsi::String::createFromUtf8(rt, errorCode),
          jsi::String::createFromUtf8(rt, message)
        );

        jsFunction.call(
          rt,
          (const jsi::Value *) &codedError,
          (size_t) 1
        );

        return;
      }

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
      jni::global_ref<SharedRef::javaobject> arg,
      bool isRejectCallback
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
} // namespace expo
