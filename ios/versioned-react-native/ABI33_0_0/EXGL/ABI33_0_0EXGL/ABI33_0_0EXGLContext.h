// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL-CPP/UEXGL.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistry.h>

@class ABI33_0_0EXGLContext;

@protocol ABI33_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI33_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI33_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI33_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI33_0_0EXGLContext : NSObject

- (instancetype)initWithDelegate:(id<ABI33_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI33_0_0UMModuleRegistry *)moduleRegistry;
- (void)initialize:(void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(void(^)(void))callback;
- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(ABI33_0_0UMPromiseResolveBlock)resolve reject:(ABI33_0_0UMPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI33_0_0EXGLContextDelegate> delegate;

@end
