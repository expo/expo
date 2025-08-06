// Copyright 2018-present 650 Industries. All rights reserved.

#import <jsi/jsi.h>
#import <hermes/hermes.h>

#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/ExpoModulesHostObject.h>
#import <ExpoModulesCore/EXJSIUtils.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/SharedObject.h>
#import <ExpoModulesCore/Swift.h>
#import <ExpoModulesCore/TestingJSCallInvoker.h>

@implementation EXJavaScriptRuntime {
  std::shared_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<react::CallInvoker> _jsCallInvoker;
}

/**
 Initializes a runtime that is independent from React Native and its runtime initialization.
 This flow is mostly intended for tests.
 */
- (nonnull instancetype)init
{
  if (self = [super init]) {
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
    _runtime = facebook::hermes::makeHermesRuntime();

    // This version of the Hermes uses a Promise implementation that is provided by the RN.
    // The `setImmediate` function isn't defined, but is required by the Promise implementation.
    // That's why we inject it here.
    auto setImmediatePropName = jsi::PropNameID::forUtf8(*_runtime, "setImmediate");
    _runtime->global().setProperty(
      *_runtime, setImmediatePropName, jsi::Function::createFromHostFunction(*_runtime, setImmediatePropName, 1,
        [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
          args[0].asObject(rt).asFunction(rt).call(rt);
          return jsi::Value::undefined();
        })
    );
#else
    _runtime = jsc::makeJSCRuntime();
#endif
    _jsCallInvoker = std::make_shared<expo::TestingJSCallInvoker>(_runtime);
  }
  return self;
}

- (nonnull instancetype)initWithRuntime:(nonnull jsi::Runtime *)runtime
                            callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker
{
  if (self = [super init]) {
    // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
    // In this code flow, the runtime should be owned by something else like the RCTBridge.
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

- (nonnull EXJavaScriptObject *)createObject
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(*_runtime);
  return [[EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(jsi::Object::createFromHostObject(*_runtime, jsiHostObjectPtr));
  return [[EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull EXJavaScriptObject *)global
{
  auto jsGlobalPtr = std::make_shared<jsi::Object>(_runtime->global());
  return [[EXJavaScriptObject alloc] initWith:jsGlobalPtr runtime:self];
}

- (nonnull EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSSyncFunctionBlock)block
{
  JSHostFunctionBlock hostFunctionBlock = ^jsi::Value(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> callInvoker,
    EXJavaScriptValue * _Nonnull thisValue,
    NSArray<EXJavaScriptValue *> * _Nonnull arguments) {
      NSError *error;
      EXJavaScriptValue *result = block(thisValue, arguments, &error);

      if (error == nil) {
        return [result get];
      } else {
        // `expo::makeCodedError` doesn't work during unit tests, so we construct Error and add a code,
        // instead of using the CodedError subclass.
        jsi::String jsCode = expo::convertNSStringToJSIString(runtime, error.userInfo[@"code"]);
        jsi::String jsMessage = expo::convertNSStringToJSIString(runtime, error.userInfo[@"message"]);
        jsi::Value error = runtime
          .global()
          .getProperty(runtime, "Error")
          .asObject(runtime)
          .asFunction(runtime)
          .callAsConstructor(runtime, {
            jsi::Value(runtime, jsMessage)
          });
        error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
        throw jsi::JSError(runtime, jsi::Value(runtime, error));
      }
    };
  return [self createHostFunction:name argsCount:argsCount block:hostFunctionBlock];
}

- (nonnull EXJavaScriptObject *)createAsyncFunction:(nonnull NSString *)name
                                          argsCount:(NSInteger)argsCount
                                              block:(nonnull JSAsyncFunctionBlock)block
{
  JSHostFunctionBlock hostFunctionBlock = ^jsi::Value(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> callInvoker,
    EXJavaScriptValue * _Nonnull thisValue,
    NSArray<EXJavaScriptValue *> * _Nonnull arguments) {
      if (!callInvoker) {
        // In mocked environment the call invoker may be null so it's not supported to call async functions.
        // Testing async functions is a bit more complicated anyway. See `init` description for more.
        throw jsi::JSError(runtime, "Calling async functions is not supported when the call invoker is unavailable");
      }
      // The function that is invoked as a setup of the EXJavaScript `Promise`.
      auto promiseSetup = [callInvoker, block, thisValue, arguments](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
        expo::callPromiseSetupWithBlock(runtime, callInvoker, promise, ^(RCTPromiseResolveBlock resolver, RCTPromiseRejectBlock rejecter) {
          block(thisValue, arguments, resolver, rejecter);
        });
      };
      return createPromiseAsJSIValue(runtime, promiseSetup);
    };
  return [self createHostFunction:name argsCount:argsCount block:hostFunctionBlock];
}

#pragma mark - Classes

typedef jsi::Function (^InstanceFactory)(jsi::Runtime& runtime, NSString * name, expo::common::ClassConstructor constructor);

- (nonnull EXJavaScriptObject *)createInstance:(nonnull NSString *)name
                               instanceFactory:(nonnull InstanceFactory)instanceFactory
                                   constructor:(nonnull ClassConstructorBlock)constructor
{
  expo::common::ClassConstructor jsConstructor = [self, constructor](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
    std::shared_ptr<jsi::Object> thisPtr = std::make_shared<jsi::Object>(thisValue.asObject(runtime));
    EXJavaScriptObject *caller = [[EXJavaScriptObject alloc] initWith:thisPtr runtime:self];
    NSArray<EXJavaScriptValue *> *arguments = expo::convertJSIValuesToNSArray(self, args, count);

    // Returning something else than `this` is not supported in native constructors.
    @try {
      constructor(caller, arguments);
    } @catch (NSException *exception) {
      jsi::String jsMessage = expo::convertNSStringToJSIString(runtime, exception.reason ?: @"Constructor failed");
      jsi::Value error = runtime
        .global()
        .getProperty(runtime, "Error")
        .asObject(runtime)
        .asFunction(runtime)
        .callAsConstructor(runtime, {
          jsi::Value(runtime, jsMessage)
        });
      
      if (exception.userInfo[@"code"]) {
        jsi::String jsCode = expo::convertNSStringToJSIString(runtime, exception.userInfo[@"code"]);
        error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
      }
      
      throw jsi::JSError(runtime, jsi::Value(runtime, error));
    }

    return jsi::Value(runtime, thisValue);
  };
  std::shared_ptr<jsi::Function> klass = std::make_shared<jsi::Function>(instanceFactory(*_runtime, name, jsConstructor));
  return [[EXJavaScriptObject alloc] initWith:klass runtime:self];
}

- (nullable EXJavaScriptObject *)createObjectWithPrototype:(nonnull EXJavaScriptObject *)prototype
{
  std::shared_ptr<jsi::Object> object = std::make_shared<jsi::Object>(expo::common::createObjectWithPrototype(*_runtime, [prototype getShared].get()));
  return object ? [[EXJavaScriptObject alloc] initWith:object runtime:self] : nil;
}

#pragma mark - Shared objects

- (nonnull EXJavaScriptObject *)createSharedObjectClass:(nonnull NSString *)name
                                            constructor:(nonnull ClassConstructorBlock)constructor
{
  InstanceFactory instanceFactory = ^(jsi::Runtime& runtime, NSString * name, expo::common::ClassConstructor constructor){
    return expo::SharedObject::createClass(*self->_runtime, [name UTF8String], constructor);
  };
  
  return [self createInstance:name instanceFactory:instanceFactory constructor:constructor];
}

#pragma mark - Shared refs

- (nonnull EXJavaScriptObject *)createSharedRefClass:(nonnull NSString *)name
                                         constructor:(nonnull ClassConstructorBlock)constructor
{
  InstanceFactory instanceFactory = ^(jsi::Runtime& runtime, NSString * name, expo::common::ClassConstructor constructor){
    return expo::SharedRef::createClass(*self->_runtime, [name UTF8String], constructor);
  };
  
  return [self createInstance:name instanceFactory:instanceFactory constructor:constructor];
}

#pragma mark - Script evaluation

- (nonnull EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource
{
  std::shared_ptr<jsi::StringBuffer> scriptBuffer = std::make_shared<jsi::StringBuffer>([scriptSource UTF8String]);
  jsi::Value result;

  try {
    result = _runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>");
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
  return [[EXJavaScriptValue alloc] initWithRuntime:self value:std::move(result)];
}

#pragma mark - Runtime execution

- (void)schedule:(nonnull JSRuntimeExecutionBlock)block priority:(int)priority
{
#if REACT_NATIVE_TARGET_VERSION >= 75
  _jsCallInvoker->invokeAsync(SchedulerPriority(priority), [block = std::move(block)](jsi::Runtime&) {
    block();
  });
#else
  _jsCallInvoker->invokeAsync(SchedulerPriority(priority), block);
#endif
}

#pragma mark - Private

- (nonnull EXJavaScriptObject *)createHostFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSHostFunctionBlock)block
{
  jsi::PropNameID propNameId = jsi::PropNameID::forAscii(*_runtime, [name UTF8String], [name length]);
  std::weak_ptr<react::CallInvoker> weakCallInvoker = _jsCallInvoker;
  jsi::HostFunctionType function = [weakCallInvoker, block, self](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
    // Theoretically should check here whether the call invoker isn't null, but in mocked environment
    // there is no need to care about that for synchronous calls, so it's ensured in `createAsyncFunction` instead.
    auto callInvoker = weakCallInvoker.lock();
    NSArray<EXJavaScriptValue *> *arguments = expo::convertJSIValuesToNSArray(self, args, count);
    EXJavaScriptValue *thisValue = [[EXJavaScriptValue alloc] initWithRuntime:self value:jsi::Value(runtime, thisVal)];

    return block(runtime, callInvoker, thisValue, arguments);
  };
  std::shared_ptr<jsi::Object> fnPtr = std::make_shared<jsi::Object>(jsi::Function::createFromHostFunction(*_runtime, propNameId, (unsigned int)argsCount, function));
  return [[EXJavaScriptObject alloc] initWith:fnPtr runtime:self];
}

@end
