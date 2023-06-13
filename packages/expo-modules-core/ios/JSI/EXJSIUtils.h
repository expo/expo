// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <functional>

#import <jsi/jsi.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <ExpoModulesCore/EXObjectDeallocator.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

#pragma mark - Promises

using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> jsInvoker, std::shared_ptr<react::Promise> promise, PromiseInvocationBlock setupBlock);

#pragma mark - Classes

using ClassConstructor = std::function<void(jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count)>;

std::shared_ptr<jsi::Function> createClass(jsi::Runtime &runtime, const char *name, ClassConstructor constructor);

/**
 Creates a new object, using the provided object as the prototype.
 */
std::shared_ptr<jsi::Object> createObjectWithPrototype(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> prototype);

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

#pragma mark - Define property

void defineProperty(jsi::Runtime &runtime, const jsi::Object *object, const char *name, jsi::Value value);

#pragma mark - Deallocator

/**
 Sets the deallocator block on a given object, which is called when the object is being deallocated.
 */
void setDeallocator(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object, ObjectDeallocatorBlock deallocatorBlock);

#pragma mark - Errors

jsi::Value makeCodedError(jsi::Runtime &runtime, NSString *code, NSString *message);

} // namespace expo

#endif
