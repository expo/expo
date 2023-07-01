// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoGL/ABI49_0_0EXGLNativeApi.h>

@interface ABI49_0_0EXGLObject : NSObject

@property (nonatomic, assign) ABI49_0_0EXGLContextId exglCtxId;
@property (nonatomic, assign) ABI49_0_0EXGLObjectId exglObjId;

// For internal use by children -- use `[ABI49_0_0EXGLObject createWithConfig:...]` above to
// create the `ABI49_0_0EXGLObject` of the right type
- (instancetype)initWithConfig:(NSDictionary *)config;

@end
