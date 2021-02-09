// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL_CPP_LEGACY/UEXGL.h>

@interface ABI38_0_0EXGLObject : NSObject

@property (nonatomic, assign) UEXGLContextId exglCtxId;
@property (nonatomic, assign) UEXGLObjectId exglObjId;

// For internal use by children -- use `[ABI38_0_0EXGLObject createWithConfig:...]` above to
// create the `ABI38_0_0EXGLObject` of the right type
- (instancetype)initWithConfig:(NSDictionary *)config;

@end
