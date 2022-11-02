// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXGL/ABI45_0_0EXGLObject.h>

@implementation ABI45_0_0EXGLObject

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if ((self = [super init])) {
    _exglCtxId = [config[@"exglCtxId"] unsignedIntValue];
    _exglObjId = ABI45_0_0EXGLContextCreateObject(_exglCtxId);
  }
  return self;
}

- (void)dealloc
{
  if (_exglObjId != 0) {
    ABI45_0_0EXGLContextDestroyObject(_exglCtxId, _exglObjId);
  }
}

@end

