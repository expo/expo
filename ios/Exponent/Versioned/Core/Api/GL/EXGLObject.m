#import "EXGLObject.h"

#import "EXGLGPUImageObject.h"

@implementation EXGLObject

+ (instancetype)createWithConfig:(NSDictionary *)config
{
  // TODO(nikki): Maintain these `config` --> `EXGLObject` implementation mapping rules in a common place
  if (config[@"texture"]) {
    if (config[@"texture"][@"camera"]) {
      return [[EXGLGPUImageObject alloc] initWithConfig:config];
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

