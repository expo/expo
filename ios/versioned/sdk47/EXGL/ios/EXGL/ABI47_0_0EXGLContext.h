// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <ABI47_0_0EXGL/ABI47_0_0EXGLNativeApi.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistry.h>

@class ABI47_0_0EXGLContext;

@protocol ABI47_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI47_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI47_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI47_0_0EXGLContext *)context;
- (ABI47_0_0EXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI47_0_0EXGLContext : NSObject

- (nullable instancetype)initWithDelegate:(nullable id<ABI47_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI47_0_0EXModuleRegistry *)moduleRegistry;
- (void)initialize;
- (void)prepare:(nullable void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (nullable EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull ABI47_0_0EXPromiseResolveBlock)resolve reject:(nonnull ABI47_0_0EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) ABI47_0_0EXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI47_0_0EXGLContextDelegate> delegate;

@end
