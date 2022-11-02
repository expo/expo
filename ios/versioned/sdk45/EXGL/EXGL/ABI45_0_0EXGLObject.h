// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0EXGL_CPP/ABI45_0_0EXGL.h>

@interface ABI45_0_0EXGLObject : NSObject

@property (nonatomic, assign) ABI45_0_0EXGLContextId exglCtxId;
@property (nonatomic, assign) ABI45_0_0EXGLObjectId exglObjId;

// For internal use by children -- use `[ABI45_0_0EXGLObject createWithConfig:...]` above to
// create the `ABI45_0_0EXGLObject` of the right type
- (instancetype)initWithConfig:(NSDictionary *)config;

@end
