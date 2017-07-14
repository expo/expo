#import "ABI19_0_0EXGLObject.h"

#import "ABI19_0_0EXGLGPUImageObject.h"

@implementation ABI19_0_0EXGLObject

+ (instancetype)createWithConfig:(NSDictionary *)config
{
  // TODO(nikki): Maintain these `config` --> `ABI19_0_0EXGLObject` implementation mapping rules in a common place
  if (config[@"texture"]) {
    if (config[@"texture"][@"camera"]) {
      return [[ABI19_0_0EXGLGPUImageObject alloc] initWithConfig:config];
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

