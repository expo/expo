// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <ABI48_0_0ExpoGL/ABI48_0_0EXGLNativeApi.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistry.h>

@class ABI48_0_0EXGLContext;

@protocol ABI48_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI48_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI48_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI48_0_0EXGLContext *)context;
- (ABI48_0_0EXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI48_0_0EXGLContext : NSObject

- (nullable instancetype)initWithDelegate:(nullable id<ABI48_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI48_0_0EXModuleRegistry *)moduleRegistry;
- (void)initialize;
- (void)prepare:(nullable void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (nullable EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull ABI48_0_0EXPromiseResolveBlock)resolve reject:(nonnull ABI48_0_0EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) ABI48_0_0EXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI48_0_0EXGLContextDelegate> delegate;

@end
