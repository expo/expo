// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpoHeader.pch"
#include "JavaCallback.h"
#include "JSIContext.h"
#include "types/JNIToJSIConverter.h"
#include "Exceptions.h"

namespace expo {

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
                   makeNativeMethod("invokeNative", JavaCallback::invokeJavaScriptArrayBuffer),
                   makeNativeMethod("invokeNative", JavaCallback::invokeNativeArrayBuffer),
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

void JavaCallback::invokeWithResolver(
  std::function<void(jsi::Runtime &rt, jsi::Function &jsFunction)> resolver
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
      resolver = std::move(resolver)
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

      resolver(rt, jsFunction);
      strongContext->invalidate();
    });
}

template<class T>
void JavaCallback::invokeJSFunctionForArray(T &arg) {
  size_t size = arg->size();
  auto region = arg->getRegion((jsize) 0, size);
  RawArray<typename decltype(region)::element_type> rawArray;
  rawArray.size = size;
  rawArray.data = std::move(region);

  invokeWithResolver(
    [rawArray = std::move(rawArray)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(rawArray)));
    }
  );
}

void JavaCallback::invoke() {
  invokeWithResolver(
    [](jsi::Runtime &rt, jsi::Function &jsFunction) {
      jsFunction.call(rt, {jsi::Value::null()});
    }
  );
}

void JavaCallback::invokeBool(bool result) {
  invokeWithResolver(
    [result](jsi::Runtime &rt, jsi::Function &jsFunction) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, result));
    }
  );
}

void JavaCallback::invokeInt(int result) {
  invokeWithResolver(
    [result](jsi::Runtime &rt, jsi::Function &jsFunction) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, result));
    }
  );
}

void JavaCallback::invokeDouble(double result) {
  invokeWithResolver(
    [result](jsi::Runtime &rt, jsi::Function &jsFunction) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, result));
    }
  );
}

void JavaCallback::invokeFloat(float result) {
  invokeWithResolver(
    [result](jsi::Runtime &rt, jsi::Function &jsFunction) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, result));
    }
  );
}

void JavaCallback::invokeString(jni::alias_ref<jstring> result) {
  JNIEnv *env = jni::Environment::current();
  const char *rawValue = env->GetStringUTFChars(result.get(), nullptr);
  std::string parsedResult = rawValue;
  env->ReleaseStringUTFChars(result.get(), rawValue);
  invokeWithResolver(
    [parsedResult = std::move(parsedResult)](jsi::Runtime &rt, jsi::Function &jsFunction) {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, parsedResult));
    }
  );
}

void JavaCallback::invokeCollection(jni::alias_ref<jni::JCollection<jobject>> result) {
  jni::global_ref<jni::JCollection<jobject>> globalResult = jni::make_global(result);
  invokeWithResolver(
    [globalResult = std::move(globalResult)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(globalResult)));
    }
  );
}

void JavaCallback::invokeMap(jni::alias_ref<jni::JMap<jstring, jobject>> result) {
  jni::global_ref<jni::JMap<jstring, jobject>> globalResult = jni::make_global(result);
  invokeWithResolver(
    [globalResult = std::move(globalResult)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(globalResult)));
    }
  );
}

void
JavaCallback::invokeWritableArray(jni::alias_ref<react::WritableNativeArray::javaobject> result) {
  auto consumed = result->cthis()->consume();
  invokeWithResolver(
    [consumed = std::move(consumed)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(consumed)));
    }
  );
}

void JavaCallback::invokeWritableMap(jni::alias_ref<react::WritableNativeMap::javaobject> result) {
  auto consumed = result->cthis()->consume();
  invokeWithResolver(
    [consumed = std::move(consumed)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(consumed)));
    }
  );
}

void JavaCallback::invokeSharedObject(jni::alias_ref<JSharedObject::javaobject> result) {
  auto globalResult = jni::make_global(result);
  invokeWithResolver(
    [globalResult = std::move(globalResult)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(globalResult)));
    }
  );
}

void JavaCallback::invokeJavaScriptArrayBuffer(
  jni::alias_ref<JavaScriptArrayBuffer::javaobject> result) {
  auto globalResult = jni::make_global(result);
  invokeWithResolver(
    [globalResult = std::move(globalResult)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(globalResult)));
    }
  );
}

void JavaCallback::invokeNativeArrayBuffer(jni::alias_ref<NativeArrayBuffer::javaobject> result) {
  auto globalResult = jni::make_global(result);
  invokeWithResolver(
    [globalResult = std::move(globalResult)](jsi::Runtime &rt, jsi::Function &jsFunction) mutable {
      jsFunction.call(rt, convertToJS(jni::Environment::current(), rt, std::move(globalResult)));
    }
  );
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
