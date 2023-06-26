// Copyright 2023-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXJSIConversions.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXRawJavaScriptFunction.h>

@implementation ABI49_0_0EXRawJavaScriptFunction {
  /**
   Pointer to the `ABI49_0_0EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak ABI49_0_0EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the underlying JSI function.
   */
  std::shared_ptr<jsi::Function> _function;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Function>)function
                         runtime:(nonnull ABI49_0_0EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;
    _function = function;
  }
  return self;
}

- (nonnull ABI49_0_0EXJavaScriptValue *)callWithArguments:(nonnull NSArray<id> *)arguments
                                      thisObject:(nullable ABI49_0_0EXJavaScriptObject *)thisObject
                                   asConstructor:(BOOL)asConstructor
{
  jsi::Runtime *runtime = [_runtime get];
  std::vector<jsi::Value> vector = ABI49_0_0expo::convertNSArrayToStdVector(*runtime, arguments);
  const jsi::Value *data = vector.data();
  jsi::Value result;

  if (asConstructor) {
    result = _function->callAsConstructor(*runtime, data, arguments.count);
  } else if (thisObject) {
    result = _function->callWithThis(*runtime, *[thisObject get], data, arguments.count);
  } else {
    result = _function->call(*runtime, data, arguments.count);
  }

  std::shared_ptr<jsi::Value> resultPtr = std::make_shared<jsi::Value>(*runtime, result);
  return [[ABI49_0_0EXJavaScriptValue alloc] initWithRuntime:_runtime value:resultPtr];
}

@end
