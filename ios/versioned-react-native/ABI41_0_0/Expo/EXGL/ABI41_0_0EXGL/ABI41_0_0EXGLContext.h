// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL_CPP/UEXGL.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>

@class ABI41_0_0EXGLContext;

@protocol ABI41_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI41_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI41_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI41_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI41_0_0EXGLContext : NSObject

- (nullable instancetype)initWithDelegate:(nullable id<ABI41_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI41_0_0UMModuleRegistry *)moduleRegistry;
- (void)initialize;
- (void)prepare:(nullable void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (nullable EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull ABI41_0_0UMPromiseResolveBlock)resolve reject:(nonnull ABI41_0_0UMPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI41_0_0EXGLContextDelegate> delegate;

@end
