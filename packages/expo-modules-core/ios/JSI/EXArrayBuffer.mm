// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXArrayBuffer.h>
#import <ExpoModulesJSI/MemoryBuffer.h>

@implementation EXArrayBufferStrongRef {
  std::shared_ptr<expo::MemoryBuffer> _ptr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<expo::MemoryBuffer>)ptr {
  if (self = [super init]) {
    _ptr = ptr;
  }
  return self;
}

- (void)reset
{
  _ptr.reset();
}

@end

@implementation EXNativeArrayBuffer {
  std::shared_ptr<expo::MemoryBuffer> _buffer;
}

- (nonnull instancetype)initWithData:(uint8_t*)data
                                size:(size_t)size
                             cleanup:(void (^)(void))cleanup
{
  if (self = [super init]) {
    expo::CleanupFunc deleteFn = [=]() {
      cleanup();
    };
    _buffer = std::make_shared<expo::MemoryBuffer>(data, size, std::move(deleteFn));
  }
  return self;
}

- (std::shared_ptr<jsi::MutableBuffer>)jsiBuffer {
  return _buffer;
}

- (size_t)getSize {
  return _buffer->size();
}

- (nonnull void *)getUnsafeMutableRawPointer {
  return _buffer->data();
}

- (EXArrayBufferStrongRef * _Nullable)memoryStrongRef {
  return [[EXArrayBufferStrongRef alloc] initWith:_buffer];
}


@end

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

- (size_t)getSize {
  return _jsiBuffer->size(*[_runtime get]);
}

- (nonnull void *)getUnsafeMutableRawPointer {
  return _jsiBuffer->data(*[_runtime get]);
}

- (EXArrayBufferStrongRef * _Nullable)memoryStrongRef {
  // JavaScript ArrayBuffers don't provide direct strong references to the underlying
  // memory since the JS runtime  owns the memory and manages its lifetime.
  return nullptr;
}


@end
