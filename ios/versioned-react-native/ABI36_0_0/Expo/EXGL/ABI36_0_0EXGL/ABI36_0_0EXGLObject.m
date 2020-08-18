// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXGL/ABI36_0_0EXGLObject.h>

@implementation ABI36_0_0EXGLObject

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if ((self = [super init])) {
    _exglCtxId = [config[@"exglCtxId"] unsignedIntValue];
    _exglObjId = UEXGLContextCreateObject__Legacy(_exglCtxId);
  }
  return self;
}

- (void)dealloc
{
  if (_exglObjId != 0) {
    UEXGLContextDestroyObject__Legacy(_exglCtxId, _exglObjId);
  }
}

@end
