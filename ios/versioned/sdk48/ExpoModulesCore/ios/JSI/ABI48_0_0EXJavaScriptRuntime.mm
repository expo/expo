// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0jsi/ABI48_0_0jsi.h>

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#elif __has_include(<ABI48_0_0React-jsc/ABI48_0_0JSCRuntime.h>)
// react-native@>=0.71 has a specific ABI48_0_0React-jsc pod
#import <ABI48_0_0React-jsc/ABI48_0_0JSCRuntime.h>
#else
#import <ABI48_0_0jsi/ABI48_0_0JSCRuntime.h>
#endif

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptRuntime.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0ExpoModulesHostObject.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJSIUtils.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJSIConversions.h>
#import <ABI48_0_0ExpoModulesCore/Swift.h>


/**
 Property name of the main object in the Expo JS runtime.
 */
static NSString *mainObjectPropertyName = @"expo";

@implementation ABI48_0_0EXJavaScriptRuntime {
  std::shared_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<react::CallInvoker> _jsCallInvoker;
  ABI48_0_0EXJavaScriptObject *_mainObject;
}

/**
 Initializes a runtime that is independent from ABI48_0_0React Native and its runtime initialization.
 This flow is mostly intended for tests. The JS call invoker is unavailable thus calling async functions is not supported.
 TODO: Implement the call invoker when it becomes necessary.
 */
- (nonnull instancetype)init
{
  if (self = [super init]) {
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
    _runtime = ABI48_0_0facebook::hermes::makeHermesRuntime();
#else
    _runtime = jsc::makeJSCRuntime();
#endif
    _jsCallInvoker = nil;
    [self initializeMainObject];
  }
  return self;
}

- (nonnull instancetype)initWithRuntime:(nonnull jsi::Runtime *)runtime
                            callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker
{
  if (self = [super init]) {
    // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
    // In this code flow, the runtime should be owned by something else like the ABI48_0_0RCTBridge.
    // See explanation for constructor (8): https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr
    _runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), runtime);
    _jsCallInvoker = callInvoker;
    [self initializeMainObject];
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

- (nonnull ABI48_0_0EXJavaScriptObject *)createObject
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(*_runtime);
  return [[ABI48_0_0EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull ABI48_0_0EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(jsi::Object::createFromHostObject(*_runtime, jsiHostObjectPtr));
  return [[ABI48_0_0EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull ABI48_0_0EXJavaScriptObject *)global
{
  auto jsGlobalPtr = std::make_shared<jsi::Object>(_runtime->global());
  return [[ABI48_0_0EXJavaScriptObject alloc] initWith:jsGlobalPtr runtime:self];
}

- (nonnull ABI48_0_0EXJavaScriptObject *)mainObject
{
  return _mainObject;
}

- (nonnull ABI48_0_0EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSSyncFunctionBlock)block
{
  JSHostFunctionBlock hostFunctionBlock = ^jsi::Value(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> callInvoker,
    ABI48_0_0EXJavaScriptValue * _Nonnull thisValue,
    NSArray<ABI48_0_0EXJavaScriptValue *> * _Nonnull arguments) {
      NSError *error;
      id result = block(thisValue, arguments, &error);

      if (error == nil) {
        return ABI48_0_0expo::convertObjCObjectToJSIValue(runtime, result);
      } else {
        throw jsi::JSError(runtime, [error.userInfo[@"message"] UTF8String]);
      }
    };
  return [self createHostFunction:name argsCount:argsCount block:hostFunctionBlock];
}

- (nonnull ABI48_0_0EXJavaScriptObject *)createAsyncFunction:(nonnull NSString *)name
                                          argsCount:(NSInteger)argsCount
                                              block:(nonnull JSAsyncFunctionBlock)block
{
  JSHostFunctionBlock hostFunctionBlock = ^jsi::Value(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> callInvoker,
    ABI48_0_0EXJavaScriptValue * _Nonnull thisValue,
    NSArray<ABI48_0_0EXJavaScriptValue *> * _Nonnull arguments) {
      if (!callInvoker) {
        // In mocked environment the call invoker may be null so it's not supported to call async functions.
        // Testing async functions is a bit more complicated anyway. See `init` description for more.
        throw jsi::JSError(runtime, "Calling async functions is not supported when the call invoker is unavailable");
      }
      // The function that is invoked as a setup of the ABI48_0_0EXJavaScript `Promise`.
      auto promiseSetup = [callInvoker, block, thisValue, arguments](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
        ABI48_0_0expo::callPromiseSetupWithBlock(runtime, callInvoker, promise, ^(ABI48_0_0RCTPromiseResolveBlock resolver, ABI48_0_0RCTPromiseRejectBlock rejecter) {
          block(thisValue, arguments, resolver, rejecter);
        });
      };
      return createPromiseAsJSIValue(runtime, promiseSetup);
    };
  return [self createHostFunction:name argsCount:argsCount block:hostFunctionBlock];
}

#pragma mark - Classes

- (nonnull ABI48_0_0EXJavaScriptObject *)createClass:(nonnull NSString *)name
                                constructor:(nonnull ClassConstructorBlock)constructor
{
  ABI48_0_0expo::ClassConstructor jsConstructor = [self, constructor](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    std::shared_ptr<jsi::Object> thisPtr = std::make_shared<jsi::Object>(thisValue.asObject(runtime));
    ABI48_0_0EXJavaScriptObject *caller = [[ABI48_0_0EXJavaScriptObject alloc] initWith:thisPtr runtime:self];
    NSArray<ABI48_0_0EXJavaScriptValue *> *arguments = ABI48_0_0expo::convertJSIValuesToNSArray(self, args, count);

    constructor(caller, arguments);
  };
  std::shared_ptr<jsi::Function> klass = ABI48_0_0expo::createClass(*_runtime, [name UTF8String], jsConstructor);
  return [[ABI48_0_0EXJavaScriptObject alloc] initWith:klass runtime:self];
}

#pragma mark - Script evaluation

- (nonnull ABI48_0_0EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource
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
  } catch (jsi::JSIException &error) {
    NSString *reason = [NSString stringWithUTF8String:error.what()];
    
    @throw [NSException exceptionWithName:@"ScriptEvaluationException" reason:reason userInfo:@{
      @"message": reason
    }];
  }
  return [[ABI48_0_0EXJavaScriptValue alloc] initWithRuntime:self value:result];
}

#pragma mark - Private

- (void)initializeMainObject
{
  if (!_mainObject) {
    // Add the main object to the runtime (`global.expo`).
    _mainObject = [self createObject];
    [[self global] defineProperty:mainObjectPropertyName value:_mainObject options:ABI48_0_0EXJavaScriptObjectPropertyDescriptorEnumerable];
  }
}

- (nonnull ABI48_0_0EXJavaScriptObject *)createHostFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSHostFunctionBlock)block
{
  jsi::PropNameID propNameId = jsi::PropNameID::forAscii(*_runtime, [name UTF8String], [name length]);
  std::weak_ptr<react::CallInvoker> weakCallInvoker = _jsCallInvoker;
  jsi::HostFunctionType function = [weakCallInvoker, block, self](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
    // Theoretically should check here whether the call invoker isn't null, but in mocked environment
    // there is no need to care about that for synchronous calls, so it's ensured in `createAsyncFunction` instead.
    auto callInvoker = weakCallInvoker.lock();
    NSArray<ABI48_0_0EXJavaScriptValue *> *arguments = ABI48_0_0expo::convertJSIValuesToNSArray(self, args, count);
    std::shared_ptr<jsi::Value> thisValPtr = std::make_shared<jsi::Value>(runtime, std::move(thisVal));
    ABI48_0_0EXJavaScriptValue *thisValue = [[ABI48_0_0EXJavaScriptValue alloc] initWithRuntime:self value:thisValPtr];

    return block(runtime, callInvoker, thisValue, arguments);
  };
  std::shared_ptr<jsi::Object> fnPtr = std::make_shared<jsi::Object>(jsi::Function::createFromHostFunction(*_runtime, propNameId, (unsigned int)argsCount, function));
  return [[ABI48_0_0EXJavaScriptObject alloc] initWith:fnPtr runtime:self];
}

@end
