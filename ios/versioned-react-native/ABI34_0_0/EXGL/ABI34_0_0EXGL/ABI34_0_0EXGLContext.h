// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL-CPP/UEXGL.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistry.h>

@class ABI34_0_0EXGLContext;

@protocol ABI34_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI34_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI34_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI34_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI34_0_0EXGLContext : NSObject

- (nullable instancetype)initWithDelegate:(nullable id<ABI34_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI34_0_0UMModuleRegistry *)moduleRegistry;
- (void)initialize:(nullable void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (nullable EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull ABI34_0_0UMPromiseResolveBlock)resolve reject:(nonnull ABI34_0_0UMPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI34_0_0EXGLContextDelegate> delegate;

@end
