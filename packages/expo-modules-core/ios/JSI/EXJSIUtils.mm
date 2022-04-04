// Copyright 2022-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJSIUtils.h>

using namespace facebook;

namespace expo {

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<Promise> promise, PromiseInvocationBlock setupBlock)
{
  auto weakResolveWrapper = CallbackWrapper::createWeak(promise->resolve_.getFunction(runtime), runtime, jsInvoker);
  auto weakRejectWrapper = CallbackWrapper::createWeak(promise->reject_.getFunction(runtime), runtime, jsInvoker);

  __block BOOL resolveWasCalled = NO;
  __block BOOL rejectWasCalled = NO;

  RCTPromiseResolveBlock resolveBlock = ^(id result) {
    if (rejectWasCalled) {
      throw std::runtime_error("Tried to resolve a promise after it's already been rejected.");
    }

    if (resolveWasCalled) {
      throw std::runtime_error("Tried to resolve a promise more than once.");
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

    resolveWasCalled = YES;
  };

  RCTPromiseRejectBlock rejectBlock = ^(NSString *code, NSString *message, NSError *error) {
    if (resolveWasCalled) {
      throw std::runtime_error("Tried to reject a promise after it's already been resolved.");
    }

    if (rejectWasCalled) {
      throw std::runtime_error("Tried to reject a promise more than once.");
    }

    auto strongResolveWrapper = weakResolveWrapper.lock();
    auto strongRejectWrapper = weakRejectWrapper.lock();
    if (!strongResolveWrapper || !strongRejectWrapper) {
      return;
    }

    NSDictionary *jsError = RCTJSErrorFromCodeMessageAndNSError(code, message, error);
    strongRejectWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, jsError]() {
      auto strongResolveWrapper2 = weakResolveWrapper.lock();
      auto strongRejectWrapper2 = weakRejectWrapper.lock();
      if (!strongResolveWrapper2 || !strongRejectWrapper2) {
        return;
      }

      jsi::Runtime &rt = strongRejectWrapper2->runtime();
      jsi::Value arg = convertNSDictionaryToJSIObject(rt, jsError);
      strongRejectWrapper2->callback().call(rt, arg);

      strongResolveWrapper2->destroy();
      strongRejectWrapper2->destroy();
    });

    rejectWasCalled = YES;
  };

  setupBlock(resolveBlock, rejectBlock);
}

} // namespace expo
