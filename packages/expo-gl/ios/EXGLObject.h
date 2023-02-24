// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoGL/EXGLNativeApi.h>

@interface EXGLObject : NSObject

@property (nonatomic, assign) EXGLContextId exglCtxId;
@property (nonatomic, assign) EXGLObjectId exglObjId;

// For internal use by children -- use `[EXGLObject createWithConfig:...]` above to
// create the `EXGLObject` of the right type
- (instancetype)initWithConfig:(NSDictionary *)config;

@end
