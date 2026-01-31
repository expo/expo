// Copyright 2022-present 650 Industries. All rights reserved.

#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

#import <ExpoModulesJSI/EXJSIConversions.h>
#import <ExpoModulesJSI/EXJSIUtils.h>
#import <ExpoModulesJSI/JSIUtils.h>

namespace expo {

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<Promise> promise, PromiseInvocationBlock setupBlock)
{
  auto weakResolveWrapper = react::CallbackWrapper::createWeak(promise->resolve_.getFunction(runtime), runtime, jsInvoker);
  auto weakRejectWrapper = react::CallbackWrapper::createWeak(promise->reject_.getFunction(runtime), runtime, jsInvoker);

  __block BOOL isSettled = NO;

  RCTPromiseResolveBlock resolveBlock = ^(id result) {
    if (isSettled) {
      // The promise is already either resolved or rejected.
      return;
    }

    auto strongResolveWrapper = weakResolveWrapper.lock();
    auto strongRejectWrapper = weakRejectWrapper.lock();
    if (!strongResolveWrapper || !strongRejectWrapper) {
      return;
    }

    strongResolveWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, result]() {
      auto strongResolveWrapper2 = weakResolveWrapper.lock();
      auto strongRejectWrapper2 = weakRejectWrapper.lock();
      if (!strongResolveWrapper2 || !strongRejectWrapper2) {
        return;
      }

      jsi::Runtime &rt = strongResolveWrapper2->runtime();
      jsi::Value arg = convertObjCObjectToJSIValue(rt, result);
      strongResolveWrapper2->callback().call(rt, arg);

      strongResolveWrapper2->destroy();
      strongRejectWrapper2->destroy();
    });

    isSettled = YES;
  };

  RCTPromiseRejectBlock rejectBlock = ^(NSString *code, NSString *message, NSError *error) {
    if (isSettled) {
      // The promise is already either resolved or rejected.
      return;
    }

    auto strongResolveWrapper = weakResolveWrapper.lock();
    auto strongRejectWrapper = weakRejectWrapper.lock();
    if (!strongResolveWrapper || !strongRejectWrapper) {
      return;
    }

    strongRejectWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, code, message]() {
      auto strongResolveWrapper2 = weakResolveWrapper.lock();
      auto strongRejectWrapper2 = weakRejectWrapper.lock();
      if (!strongResolveWrapper2 || !strongRejectWrapper2) {
        return;
      }

      jsi::Runtime &rt = strongRejectWrapper2->runtime();
      jsi::Value jsError = makeCodedError(rt, code, message);

      strongRejectWrapper2->callback().call(rt, jsError);

      strongResolveWrapper2->destroy();
      strongRejectWrapper2->destroy();
    });

    isSettled = YES;
  };

  setupBlock(resolveBlock, rejectBlock);
}

#pragma mark - Weak objects

bool isWeakRefSupported(jsi::Runtime &runtime) {
  return runtime.global().hasProperty(runtime, "WeakRef");
}

std::shared_ptr<jsi::Object> createWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object) {
  jsi::Object weakRef = runtime
    .global()
    .getProperty(runtime, "WeakRef")
    .asObject(runtime)
    .asFunction(runtime)
    .callAsConstructor(runtime, jsi::Value(runtime, *object))
    .asObject(runtime);
  return std::make_shared<jsi::Object>(std::move(weakRef));
}

std::shared_ptr<jsi::Object> derefWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object) {
  jsi::Value ref = object->getProperty(runtime, "deref")
    .asObject(runtime)
    .asFunction(runtime)
    .callWithThis(runtime, *object);

  if (ref.isUndefined()) {
    return nullptr;
  }
  return std::make_shared<jsi::Object>(ref.asObject(runtime));
}

#pragma mark - Errors

jsi::Value makeCodedError(jsi::Runtime &runtime, NSString *code, NSString *message) {
  jsi::String jsCode = convertNSStringToJSIString(runtime, code);
  jsi::String jsMessage = convertNSStringToJSIString(runtime, message);

  return runtime
    .global()
    .getProperty(runtime, "ExpoModulesCore_CodedError")
    .asObject(runtime)
    .asFunction(runtime)
    .callAsConstructor(runtime, {
      jsi::Value(runtime, jsCode),
      jsi::Value(runtime, jsMessage)
    });
}

#pragma mark - Runtime

jsi::Runtime &createHermesRuntime() {
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime = facebook::hermes::makeHermesRuntime();

  // This version of the Hermes uses a Promise implementation that is provided by the RN.
  // The `setImmediate` function isn't defined, but is required by the Promise implementation.
  // That's why we inject it here.
  jsi::PropNameID setImmediatePropName = jsi::PropNameID::forUtf8(*runtime, "setImmediate");
  jsi::Function setImmediateFunction = jsi::Function::createFromHostFunction(*runtime, setImmediatePropName, 1, [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
    args[0].asObject(rt).asFunction(rt).call(rt);
    return jsi::Value::undefined();
  });
  runtime->global().setProperty(*runtime, setImmediatePropName, setImmediateFunction);

  return *runtime.release();
}

std::shared_ptr<react::RuntimeScheduler> runtimeSchedulerFromRuntime(jsi::Runtime &runtime) {
  if (auto binding = react::RuntimeSchedulerBinding::getBinding(runtime)) {
    return binding->getRuntimeScheduler();
  }
  return nullptr;
}

#pragma mark - Host function

jsi::Function createHostFunction(jsi::Runtime &runtime, const char *_Nonnull name, HostFunctionBlock block) {
  jsi::PropNameID propName = jsi::PropNameID::forAscii(runtime, name);
  return jsi::Function::createFromHostFunction(runtime, propName, 0, [block](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *_Nonnull args, size_t count) -> jsi::Value {
    return block(runtime, thisValue, args, count);
  });
}

#pragma mark - Other helpers

jsi::Value valueFromFunction(jsi::Runtime &runtime, const jsi::Function &function) {
  return jsi::Value(runtime, function);
}

std::shared_ptr<const jsi::Buffer> makeSharedStringBuffer(const std::string &source) noexcept {
  return std::make_shared<jsi::StringBuffer>(source);
}

} // namespace expo
