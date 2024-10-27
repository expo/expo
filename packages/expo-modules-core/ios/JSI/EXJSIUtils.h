// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <functional>

#import <jsi/jsi.h>
#import <React/RCTBridgeModule.h>
#import <React/React-Core-umbrella.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <ExpoModulesCore/ObjectDeallocator.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

#pragma mark - Promises

using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> jsInvoker, std::shared_ptr<react::Promise> promise, PromiseInvocationBlock setupBlock);

#pragma mark - Weak objects

/**
 Checks whether the `WeakRef` class is available in the given runtime.
 According to the docs, it is unimplemented in JSC prior to iOS 14.5.
 As of the time of writing this comment it's also unimplemented in Hermes
 where you should use `jsi::WeakObject` instead.
 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef
 */
bool isWeakRefSupported(jsi::Runtime &runtime);

/**
 Creates the `WeakRef` with given JSI object. You should first use `isWeakRefSupported`
 to check whether this feature is supported by the runtime.
 */
std::shared_ptr<jsi::Object> createWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object);

/**
 Returns the `WeakRef` object's target object, or an empty pointer if the target object has been reclaimed.
 */
std::shared_ptr<jsi::Object> derefWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object);

#pragma mark - Errors

jsi::Value makeCodedError(jsi::Runtime &runtime, NSString *code, NSString *message);

} // namespace expo

#endif

#import <ExpoModulesCore/EXJavaScriptObject.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>

NS_SWIFT_NAME(JSIUtils)
@interface EXJSIUtils : NSObject

+ (nonnull EXJavaScriptObject *)createNativeModuleObject:(nonnull EXJavaScriptRuntime *)runtime;

+ (void)emitEvent:(nonnull NSString *)eventName
         toObject:(nonnull EXJavaScriptObject *)object
    withArguments:(nonnull NSArray<id> *)arguments
        inRuntime:(nonnull EXJavaScriptRuntime *)runtime;

@end
