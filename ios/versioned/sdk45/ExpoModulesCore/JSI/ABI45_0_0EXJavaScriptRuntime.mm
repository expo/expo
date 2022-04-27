// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0jsi/ABI45_0_0jsi.h>

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#elif __has_include(<hermes/hermes.h>)
#import <hermes/hermes.h>
#else
#import <ABI45_0_0jsi/ABI45_0_0JSCRuntime.h>
#endif

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJavaScriptRuntime.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0ExpoModulesHostObject.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJSIUtils.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJSIConversions.h>
#import <ABI45_0_0ExpoModulesCore/Swift.h>

using namespace ABI45_0_0facebook;

@implementation ABI45_0_0EXJavaScriptRuntime {
  std::shared_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<react::CallInvoker> _jsCallInvoker;
}

/**
 Initializes a runtime that is independent from ABI45_0_0React Native and its runtime initialization.
 This flow is mostly intended for tests. The JS call invoker is unavailable thus calling async functions is not supported.
 TODO: Implement the call invoker when it becomes necessary.
 */
- (nonnull instancetype)init
{
  if (self = [super init]) {
#if __has_include(<reacthermes/HermesExecutorFactory.h>) || __has_include(<hermes/hermes.h>)
    _runtime = hermes::makeHermesRuntime();
#else
    _runtime = jsc::makeJSCRuntime();
#endif
    _jsCallInvoker = nil;
  }
  return self;
}

- (nonnull instancetype)initWithRuntime:(nonnull jsi::Runtime *)runtime
                            callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker
{
  if (self = [super init]) {
    // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
    // In this code flow, the runtime should be owned by something else like the ABI45_0_0RCTBridge.
    // See explanation for constructor (8): https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr
    _runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), runtime);
    _jsCallInvoker = callInvoker;
  }
  return self;
}

- (nonnull jsi::Runtime *)get
{
  return _runtime.get();
}

- (std::shared_ptr<react::CallInvoker>)callInvoker
{
  return _jsCallInvoker;
}

- (nonnull ABI45_0_0EXJavaScriptObject *)createObject
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(*_runtime);
  return [[ABI45_0_0EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull ABI45_0_0EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(jsi::Object::createFromHostObject(*_runtime, jsiHostObjectPtr));
  return [[ABI45_0_0EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull ABI45_0_0EXJavaScriptObject *)global
{
  auto jsGlobalPtr = std::make_shared<jsi::Object>(_runtime->global());
  return [[ABI45_0_0EXJavaScriptObject alloc] initWith:jsGlobalPtr runtime:self];
}

- (jsi::Function)createSyncFunction:(nonnull NSString *)name
                          argsCount:(NSInteger)argsCount
                              block:(nonnull JSSyncFunctionBlock)block
{
  return [self createHostFunction:name argsCount:argsCount block:^jsi::Value(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray * _Nonnull arguments) {
    return ABI45_0_0expo::convertObjCObjectToJSIValue(runtime, block(arguments));
  }];
}

- (jsi::Function)createAsyncFunction:(nonnull NSString *)name
                           argsCount:(NSInteger)argsCount
                               block:(nonnull JSAsyncFunctionBlock)block
{
  return [self createHostFunction:name argsCount:argsCount block:^jsi::Value(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray *arguments) {
    if (!callInvoker) {
      // In mocked environment the call invoker may be null so it's not supported to call async functions.
      // Testing async functions is a bit more complicated anyway. See `init` description for more.
      throw jsi::JSError(runtime, "Calling async functions is not supported when the call invoker is unavailable");
    }
    // The function that is invoked as a setup of the ABI45_0_0EXJavaScript `Promise`.
    auto promiseSetup = [callInvoker, block, arguments](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
      ABI45_0_0expo::callPromiseSetupWithBlock(runtime, callInvoker, promise, ^(ABI45_0_0RCTPromiseResolveBlock resolver, ABI45_0_0RCTPromiseRejectBlock rejecter) {
        block(arguments, resolver, rejecter);
      });
    };
    return createPromiseAsJSIValue(runtime, promiseSetup);
  }];
}

#pragma mark - Script evaluation

- (nonnull ABI45_0_0EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource
{
  std::shared_ptr<jsi::StringBuffer> scriptBuffer = std::make_shared<jsi::StringBuffer>([scriptSource UTF8String]);
  std::shared_ptr<jsi::Value> result;

  try {
    result = std::make_shared<jsi::Value>(_runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>"));
  } catch (jsi::JSError &error) {
    NSString *reason = [NSString stringWithUTF8String:error.getMessage().c_str()];
    NSString *stack = [NSString stringWithUTF8String:error.getStack().c_str()];

    @throw [NSException exceptionWithName:@"ScriptEvaluationException" reason:reason userInfo:@{
      @"message": reason,
      @"stack": stack,
    }];
  }
  return [[ABI45_0_0EXJavaScriptValue alloc] initWithRuntime:self value:result];
}

#pragma mark - Private

- (jsi::Function)createHostFunction:(nonnull NSString *)name
                          argsCount:(NSInteger)argsCount
                              block:(nonnull JSHostFunctionBlock)block
{
  jsi::PropNameID propNameId = jsi::PropNameID::forAscii(*_runtime, [name UTF8String], [name length]);
  std::weak_ptr<react::CallInvoker> weakCallInvoker = _jsCallInvoker;
  jsi::HostFunctionType function = [weakCallInvoker, block, self](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
    // Theoretically should check here whether the call invoker isn't null, but in mocked environment
    // there is no need to care about that for synchronous calls, so it's ensured in `createAsyncFunction` instead.
    auto callInvoker = weakCallInvoker.lock();
    NSArray<ABI45_0_0EXJavaScriptValue *> *arguments = ABI45_0_0expo::convertJSIValuesToNSArray(self, args, count);
    return block(runtime, callInvoker, arguments);
  };
  return jsi::Function::createFromHostFunction(*_runtime, propNameId, (unsigned int)argsCount, function);
}

@end
