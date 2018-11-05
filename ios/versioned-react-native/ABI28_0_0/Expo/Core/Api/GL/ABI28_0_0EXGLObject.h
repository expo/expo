#import <EXGL-CPP/UEXGL.h>

@interface ABI28_0_0EXGLObject : NSObject

@property (nonatomic, assign) UEXGLContextId exglCtxId;
@property (nonatomic, assign) UEXGLObjectId exglObjId;

// For internal use by children -- use `[ABI28_0_0EXGLObject createWithConfig:...]` above to
// create the `ABI28_0_0EXGLObject` of the right type
- (instancetype)initWithConfig:(NSDictionary *)config;

@end
