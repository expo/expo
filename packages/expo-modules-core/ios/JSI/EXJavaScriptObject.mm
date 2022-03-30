// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>

@implementation EXJavaScriptObject {
  /**
   Pointer to the `EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the original JSI object that is being wrapped by `EXJavaScriptObject` class.
   */
  std::shared_ptr<jsi::Object> _jsObjectPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;
    _jsObjectPtr = jsObjectPtr;
  }
  return self;
}

- (nonnull jsi::Object *)get
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
  auto runtime = [_runtime get];

  if (!runtime) {
    NSLog(@"Cannot set '%@' property when the EXJavaScript runtime is no longer available.", key);
    return;
  }
  if ([obj isKindOfClass:[EXJavaScriptObject class]]) {
    _jsObjectPtr->setProperty(*runtime, [key UTF8String], *[obj get]);
  } else {
    _jsObjectPtr->setProperty(*runtime, [key UTF8String], expo::convertObjCObjectToJSIValue(*runtime, obj));
  }
}

#pragma mark - Functions

- (void)setAsyncFunction:(nonnull NSString *)name
               argsCount:(NSInteger)argsCount
                   block:(nonnull JSAsyncFunctionBlock)block
{
  if (!_runtime) {
    NSLog(@"Cannot set '%@' async function when the EXJavaScript runtime is no longer available.", name);
    return;
  }
  jsi::Function function = [_runtime createAsyncFunction:name argsCount:argsCount block:block];
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], function);
}

- (void)setSyncFunction:(nonnull NSString *)name
              argsCount:(NSInteger)argsCount
                  block:(nonnull JSSyncFunctionBlock)block
{
  if (!_runtime) {
    NSLog(@"Cannot set '%@' sync function when the EXJavaScript runtime is no longer available.", name);
    return;
  }
  jsi::Function function = [_runtime createSyncFunction:name argsCount:argsCount block:block];
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], function);
}

@end
