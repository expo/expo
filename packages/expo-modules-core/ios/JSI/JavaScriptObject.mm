// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/JSIConversions.h>
#import <ExpoModulesCore/JavaScriptObject.h>
#import <ExpoModulesCore/JavaScriptRuntime.h>
#import <ExpoModulesCore/ExpoModulesProxySpec.h>

@implementation JavaScriptObject {
  __weak JavaScriptRuntime *_runtime;
  std::shared_ptr<jsi::Object> _jsObjectPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObject
                         runtime:(nonnull JavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;
    _jsObjectPtr = jsObject;
  }
  return self;
}

- (jsi::Object *)get
{
  return _jsObjectPtr.get();
}

#pragma mark - Subscripting

- (nullable id)objectForKeyedSubscript:(nonnull NSString *)key
{
  auto runtime = [_runtime get];
  auto callInvoker = [_runtime callInvoker];

  if (runtime && callInvoker) {
    auto value = _jsObjectPtr->getProperty(*runtime, [key UTF8String]);
    return expo::convertJSIValueToObjCObject(*runtime, value, callInvoker);
  }
  return nil;
}

- (void)setObject:(nullable id)obj forKeyedSubscript:(nonnull NSString *)key
{
  if (auto runtime = [_runtime get]) {
    if ([obj isKindOfClass:[JavaScriptObject class]]) {
      _jsObjectPtr->setProperty(*runtime, [key UTF8String], *[obj get]);
    } else {
      _jsObjectPtr->setProperty(*runtime, [key UTF8String], expo::convertObjCObjectToJSIValue(*runtime, obj));
    }
  }
}

#pragma mark - Functions

- (void)setAsyncFunction:(nonnull NSString *)name
               argsCount:(NSInteger)argsCount
                   block:(nonnull JSAsyncFunctionBlock)block
{
  jsi::Function function = [_runtime createAsyncFunction:name argsCount:argsCount block:block];
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], function);
}

- (void)setSyncFunction:(nonnull NSString *)name
              argsCount:(NSInteger)argsCount
                  block:(nonnull JSSyncFunctionBlock)block
{
  jsi::Function function = [_runtime createSyncFunction:name argsCount:argsCount block:block];
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], function);
}

@end
