#import "ABI18_0_0EXGLObject.h"

#import "ABI18_0_0EXGLGPUImageObject.h"

@implementation ABI18_0_0EXGLObject

+ (instancetype)createWithConfig:(NSDictionary *)config
{
  // TODO(nikki): Maintain these `config` --> `ABI18_0_0EXGLObject` implementation mapping rules in a common place
  if (config[@"texture"]) {
    if (config[@"texture"][@"camera"]) {
      return [[ABI18_0_0EXGLGPUImageObject alloc] initWithConfig:config];
    }
  }
  
  return nil;
}

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if ((self = [super init])) {
    _exglCtxId = [config[@"exglCtxId"] unsignedIntValue];
    _exglObjId = UEXGLContextCreateObject(_exglCtxId);
  }
  return self;
}

- (void)dealloc
{
  if (_exglObjId != 0) {
    UEXGLContextDestroyObject(_exglCtxId, _exglObjId);
  }
}

@end

