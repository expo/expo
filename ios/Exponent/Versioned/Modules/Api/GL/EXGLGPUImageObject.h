#import "EXGLObject.h"

// A texture backed by a source from the `GPUImage` library

@interface EXGLGPUImageObject : EXGLObject

- (instancetype)initWithConfig:(NSDictionary *)config;

@end
