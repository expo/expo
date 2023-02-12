// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXGL/ABI47_0_0EXGLObject.h>

@implementation ABI47_0_0EXGLObject

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if ((self = [super init])) {
    _exglCtxId = [config[@"exglCtxId"] unsignedIntValue];
    _exglObjId = ABI47_0_0EXGLContextCreateObject(_exglCtxId);
  }
  return self;
}

- (void)dealloc
{
  if (_exglObjId != 0) {
    ABI47_0_0EXGLContextDestroyObject(_exglCtxId, _exglObjId);
  }
}

@end

