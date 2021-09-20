// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>

#import <ExpoModulesCore/JSIConversions.h>
#import <ExpoModulesCore/ExpoModulesProxySpec.h>

namespace expo {

using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);

static void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<Promise> promise, PromiseInvocationBlock setupBlock)
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

static jsi::Value __hostFunction_ExpoModulesProxySpec_callMethodAsync(jsi::Runtime &runtime, TurboModule &turboModule, const jsi::Value *args, size_t count)
{
  auto expoModulesProxy = static_cast<ExpoModulesProxySpec *>(&turboModule);

  // The function that is invoked as a setup of the JS `Promise`.
  auto promiseSetupFunc = [expoModulesProxy, args](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
    callPromiseSetupWithBlock(runtime, expoModulesProxy->jsInvoker_, promise, ^(RCTPromiseResolveBlock resolver, RCTPromiseRejectBlock rejecter) {
      NSString *moduleName = convertJSIStringToNSString(runtime, args[0].getString(runtime));
      NSString *methodName = convertJSIStringToNSString(runtime, args[1].getString(runtime));
      NSArray *arguments = convertJSIArrayToNSArray(runtime, args[2].getObject(runtime).asArray(runtime), expoModulesProxy->jsInvoker_);

      [expoModulesProxy->nativeModulesProxy callMethod:moduleName
                                       methodNameOrKey:methodName
                                             arguments:arguments
                                              resolver:resolver
                                              rejecter:rejecter];
    });
  };

  return createPromiseAsJSIValue(runtime, promiseSetupFunc);
}

static jsi::Value __hostFunction_ExpoModulesProxySpec_callMethodSync(jsi::Runtime &runtime, TurboModule &turboModule, const jsi::Value *args, size_t count)
{
  auto expoModulesProxy = static_cast<ExpoModulesProxySpec *>(&turboModule);
  NSString *moduleName = convertJSIStringToNSString(runtime, args[0].getString(runtime));
  NSString *methodName = convertJSIStringToNSString(runtime, args[1].getString(runtime));
  NSArray *arguments = convertJSIArrayToNSArray(runtime, args[2].getObject(runtime).asArray(runtime), expoModulesProxy->jsInvoker_);

  id result = [expoModulesProxy->nativeModulesProxy callMethodSync:moduleName
                                                        methodName:methodName
                                                         arguments:arguments];

  return convertObjCObjectToJSIValue(runtime, result);
}

ExpoModulesProxySpec::ExpoModulesProxySpec(std::shared_ptr<CallInvoker> callInvoker, EXNativeModulesProxy *nativeModulesProxy) :
  TurboModule("ExpoModulesProxy", callInvoker),
  nativeModulesProxy(nativeModulesProxy)
{
  methodMap_["callMethodAsync"] = MethodMetadata {3, __hostFunction_ExpoModulesProxySpec_callMethodAsync};

  methodMap_["callMethodSync"] = MethodMetadata {3, __hostFunction_ExpoModulesProxySpec_callMethodSync};
}

} // namespace expo
