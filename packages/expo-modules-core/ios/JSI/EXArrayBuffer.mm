// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXArrayBuffer.h>
#import <ExpoModulesJSI/MemoryBuffer.h>

@implementation EXArrayBufferStrongRef {
  std::shared_ptr<expo::MemoryBuffer> _ptr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<expo::MemoryBuffer>)ptr
{
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
