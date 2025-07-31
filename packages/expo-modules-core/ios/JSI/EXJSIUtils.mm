// Copyright 2022-present 650 Industries. All rights reserved.

#import <sstream>

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJSIUtils.h>
#import <ExpoModulesCore/JSIUtils.h>
#import <ExpoModulesCore/NativeModule.h>
#import <ExpoModulesCore/EventEmitter.h>

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

} // namespace expo

@implementation EXJSIUtils

+ (nonnull EXJavaScriptObject *)createNativeModuleObject:(nonnull EXJavaScriptRuntime *)runtime
{
  std::shared_ptr<jsi::Object> nativeModule = std::make_shared<jsi::Object>(expo::NativeModule::createInstance(*[runtime get]));
  return [[EXJavaScriptObject alloc] initWith:nativeModule runtime:runtime];
}

+ (void)emitEvent:(nonnull NSString *)eventName
         toObject:(nonnull EXJavaScriptObject *)object
    withArguments:(nonnull NSArray<id> *)arguments
        inRuntime:(nonnull EXJavaScriptRuntime *)runtime
{
  const std::vector<jsi::Value> argumentsVector(expo::convertNSArrayToStdVector(*[runtime get], arguments));
  expo::EventEmitter::emitEvent(*[runtime get], *[object get], [eventName UTF8String], std::move(argumentsVector));
}

@end
