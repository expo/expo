// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL-CPP/UEXGL.h>

@interface EXGLObject : NSObject

@property (nonatomic, assign) UEXGLContextId exglCtxId;
@property (nonatomic, assign) UEXGLObjectId exglObjId;

// For internal use by children -- use `[EXGLObject createWithConfig:...]` above to
// create the `EXGLObject` of the right type
- (instancetype)initWithConfig:(NSDictionary *)config;

@end
