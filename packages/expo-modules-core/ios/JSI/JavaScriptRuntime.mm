// Copyright 2018-present 650 Industries. All rights reserved.

#import <jsi/jsi.h>

#import <ExpoModulesCore/JavaScriptRuntime.h>
#import <ExpoModulesCore/ExpoModulesHostObject.h>
#import <ExpoModulesCore/Swift.h>

using namespace facebook;

@implementation JavaScriptRuntime {
  jsi::Runtime *_runtime;
  std::shared_ptr<react::CallInvoker> _jsCallInvoker;

  JavaScriptObject *_global;
}

- (nonnull instancetype)initWithRuntime:(jsi::Runtime &)runtime callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker
{
  if (self = [super init]) {
    _runtime = &runtime;
    _jsCallInvoker = callInvoker;

    auto jsGlobalPtr = std::make_shared<jsi::Object>(_runtime->global());
    _global = [[JavaScriptObject alloc] initWith:jsGlobalPtr runtime:self];
  }
  return self;
}

- (nonnull jsi::Runtime *)get
{
  return _runtime;
}

- (std::shared_ptr<react::CallInvoker>)callInvoker
{
  return _jsCallInvoker;
}

- (nonnull JavaScriptObject *)createObject
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(*_runtime);
  return [[JavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull JavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(jsi::Object::createFromHostObject(*_runtime, jsiHostObjectPtr));
  return [[JavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull JavaScriptObject *)global
{
  return _global;
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
    // The function that is invoked as a setup of the JavaScript `Promise`.
    auto promiseSetup = [callInvoker, block, arguments](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
      expo::callPromiseSetupWithBlock(runtime, callInvoker, promise, ^(RCTPromiseResolveBlock resolver, RCTPromiseRejectBlock rejecter) {
        block(arguments, resolver, rejecter);
      });
    };
    return createPromiseAsJSIValue(runtime, promiseSetup);
  }];
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
