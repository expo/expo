// Copyright 2023-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXRawJavaScriptFunction.h>

@implementation EXRawJavaScriptFunction {
  /**
   Pointer to the `EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the underlying JSI function.
   */
  std::shared_ptr<jsi::Function> _function;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Function>)function
                         runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;
    _function = function;
  }
  return self;
}

- (nonnull EXJavaScriptValue *)callWithArguments:(nonnull NSArray<id> *)arguments
                                      thisObject:(nullable EXJavaScriptObject *)thisObject
                                   asConstructor:(BOOL)asConstructor
{
  jsi::Runtime *runtime = [_runtime get];
  std::vector<jsi::Value> vector = expo::convertNSArrayToStdVector(*runtime, arguments);
  const jsi::Value *data = vector.data();
  jsi::Value result;

  if (asConstructor) {
    result = _function->callAsConstructor(*runtime, data, arguments.count);
  } else if (thisObject) {
    result = _function->callWithThis(*runtime, *[thisObject get], data, arguments.count);
  } else {
    result = _function->call(*runtime, data, arguments.count);
  }

  return [[EXJavaScriptValue alloc] initWithRuntime:_runtime value:std::move(result)];
}

@end
