// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJavaScriptTypedArray.h>
#import <ExpoModulesCore/TypedArray.h>

@implementation EXJavaScriptTypedArray {
  __weak EXJavaScriptRuntime *_runtime;

  std::shared_ptr<expo::TypedArray> _typedArrayPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(EXJavaScriptRuntime *)runtime
{
  if (self = [super initWith:jsObjectPtr runtime:runtime]) {
    jsi::Runtime *rt = [runtime get];
    _runtime = runtime;
    _typedArrayPtr = std::make_shared<expo::TypedArray>(*rt, *jsObjectPtr.get());
    _kind = (EXTypedArrayKind)_typedArrayPtr->getKind(*rt);
  }
  return self;
}

- (nonnull void *)getUnsafeMutableRawPointer
{
  return _typedArrayPtr->getRawPointer(*[_runtime get]);
}

@end
