// Copyright 2018-present 650 Industries. All rights reserved.

#import <jsi/jsi.h>

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#elif __has_include(<hermes/hermes.h>)
#import <hermes/hermes.h>
#else
#import <jsi/JSCRuntime.h>
#endif

#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/ExpoModulesHostObject.h>
#import <ExpoModulesCore/EXJSIUtils.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/Swift.h>

using namespace facebook;

@implementation EXJavaScriptRuntime {
  std::shared_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<react::CallInvoker> _jsCallInvoker;
}

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

- (nonnull instancetype)initWithRuntime:(std::shared_ptr<jsi::Runtime>)runtime callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker
{
  if (self = [super init]) {
    _runtime = runtime;
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

- (jsi::Function)createSyncFunction:(nonnull NSString *)name
                          argsCount:(NSInteger)argsCount
                              block:(nonnull JSSyncFunctionBlock)block
{
  return [self createHostFunction:name argsCount:argsCount block:^jsi::Value(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray * _Nonnull arguments) {
    return expo::convertObjCObjectToJSIValue(runtime, block(arguments));
  }];
}

- (jsi::Function)createAsyncFunction:(nonnull NSString *)name
                           argsCount:(NSInteger)argsCount
                               block:(nonnull JSAsyncFunctionBlock)block
{
  return [self createHostFunction:name argsCount:argsCount block:^jsi::Value(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray *arguments) {
    // The function that is invoked as a setup of the EXJavaScript `Promise`.
    auto promiseSetup = [callInvoker, block, arguments](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
      expo::callPromiseSetupWithBlock(runtime, callInvoker, promise, ^(RCTPromiseResolveBlock resolver, RCTPromiseRejectBlock rejecter) {
        block(arguments, resolver, rejecter);
      });
    };
    return createPromiseAsJSIValue(runtime, promiseSetup);
  }];
}

#pragma mark - Script evaluation

- (nullable id)evaluateScript:(nonnull NSString *)scriptSource
{
  auto scriptBuffer = std::make_shared<jsi::StringBuffer>([[NSString stringWithFormat:@"(%@)", scriptSource] UTF8String]);
  auto result = _runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>");
  return expo::convertJSIValueToObjCObject(*_runtime, result, _jsCallInvoker);
}

#pragma mark - Private

typedef jsi::Value (^JSHostFunctionBlock)(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> callInvoker, NSArray * _Nonnull arguments);

- (jsi::Function)createHostFunction:(nonnull NSString *)name
                          argsCount:(NSInteger)argsCount
                              block:(nonnull JSHostFunctionBlock)block
{
  jsi::PropNameID propNameId = jsi::PropNameID::forAscii(*_runtime, [name UTF8String], [name length]);
  std::weak_ptr<react::CallInvoker> weakCallInvoker = _jsCallInvoker;
  jsi::HostFunctionType function = [weakCallInvoker, block](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
    if (auto callInvoker = weakCallInvoker.lock()) {
      NSArray *arguments = expo::convertJSIValuesToNSArray(runtime, args, count, callInvoker);
      return block(runtime, callInvoker, arguments);
    }
    // TODO: We should throw some kind of error.
    return jsi::Value::undefined();
  };
  return jsi::Function::createFromHostFunction(*_runtime, propNameId, (unsigned int)argsCount, function);
}

@end
