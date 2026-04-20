// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXNativeArrayBuffer.h>
#import <ExpoModulesJSI/MemoryBuffer.h>

@implementation EXNativeArrayBuffer {
  std::shared_ptr<expo::MemoryBuffer> _buffer;
}

- (nonnull instancetype)initWithData:(uint8_t*)data
                                size:(size_t)size
                             cleanup:(void (^)(void))cleanup
{
  if (self = [super init]) {
    expo::CleanupFunc cleanupFn = [=]() { cleanup(); };
    _buffer = std::make_shared<expo::MemoryBuffer>(data, size, std::move(cleanupFn));
  }
  return self;
}

- (std::shared_ptr<jsi::MutableBuffer>)jsiBuffer
{
  return _buffer;
}

- (size_t)getSize
{
  return _buffer->size();
}

- (nonnull void *)getUnsafeMutableRawPointer
{
  return _buffer->data();
}

- (EXArrayBufferStrongRef * _Nullable)memoryStrongRef
{
  return [[EXArrayBufferStrongRef alloc] initWith:_buffer];
}

@end
