// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL_CPP/UEXGL.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>

@class ABI44_0_0EXGLContext;

@protocol ABI44_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI44_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI44_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI44_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI44_0_0EXGLContext : NSObject

- (nullable instancetype)initWithDelegate:(nullable id<ABI44_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI44_0_0EXModuleRegistry *)moduleRegistry;
- (void)initialize;
- (void)prepare:(nullable void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (nullable EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull ABI44_0_0EXPromiseResolveBlock)resolve reject:(nonnull ABI44_0_0EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI44_0_0EXGLContextDelegate> delegate;

@end
