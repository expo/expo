// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <functional>

#import <jsi/jsi.h>
#import <ReactCommon/RCTTurboModule.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

#pragma mark - Promises

using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> jsInvoker, std::shared_ptr<react::Promise> promise, PromiseInvocationBlock setupBlock);

#pragma mark - Classes

using ClassConstructor = std::function<void(jsi::Runtime &runtime, const jsi::Value &thisValue, jsi::Array args)>;

std::shared_ptr<jsi::Function> createClass(jsi::Runtime &runtime, const char *name, ClassConstructor constructor);

#pragma mark - Define property

void defineProperty(jsi::Runtime &runtime, const jsi::Object *object, const char *name, jsi::Value value);

} // namespace expo

#endif
