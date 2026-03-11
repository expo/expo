// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptRuntime.h>
#import <ExpoModulesJSI/EXRawJavaScriptArrayBuffer.h>

@implementation EXJavaScriptArrayBuffer {
  __weak EXJavaScriptRuntime *_runtime;
  
  std::shared_ptr<jsi::ArrayBuffer> _jsiBuffer;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(EXJavaScriptRuntime *)runtime
{
  jsi::Runtime *rt = [runtime get];
  if (!jsObjectPtr.get()->isArrayBuffer(*rt)) {
    throw std::runtime_error("Object is not an ArrayBuffer");
  }
  
  if (self = [super initWith:jsObjectPtr runtime:runtime]) {
    _runtime = runtime;
    _jsiBuffer = std::make_shared<jsi::ArrayBuffer>(jsObjectPtr.get()->getArrayBuffer(*rt));
  }
  return self;
}

- (size_t)getSize
{
  return _jsiBuffer->size(*[_runtime get]);
}

- (nonnull void *)getUnsafeMutableRawPointer
{
  return _jsiBuffer->data(*[_runtime get]);
}

- (EXArrayBufferStrongRef * _Nullable)memoryStrongRef
{
  // JavaScript ArrayBuffers don't provide direct strong references to the underlying
  // memory since the JS runtime owns the memory and manages its lifetime.
  return nullptr;
}

@end
