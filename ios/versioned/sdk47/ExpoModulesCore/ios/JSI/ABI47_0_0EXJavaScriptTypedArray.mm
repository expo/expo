// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptTypedArray.h>
#import <ABI47_0_0ExpoModulesCore/TypedArray.h>

@implementation ABI47_0_0EXJavaScriptTypedArray {
  __weak ABI47_0_0EXJavaScriptRuntime *_runtime;

  std::shared_ptr<ABI47_0_0expo::TypedArray> _typedArrayPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(ABI47_0_0EXJavaScriptRuntime *)runtime
{
  if (self = [super initWith:jsObjectPtr runtime:runtime]) {
    jsi::Runtime *rt = [runtime get];
    _runtime = runtime;
    _typedArrayPtr = std::make_shared<ABI47_0_0expo::TypedArray>(*rt, *jsObjectPtr.get());
    _kind = (ABI47_0_0EXTypedArrayKind)_typedArrayPtr->getKind(*rt);
  }
  return self;
}

- (nonnull void *)getUnsafeMutableRawPointer
{
  return _typedArrayPtr->getRawPointer(*[_runtime get]);
}

@end
