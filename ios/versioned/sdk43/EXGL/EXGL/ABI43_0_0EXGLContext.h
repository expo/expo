// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL_CPP/UEXGL.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>

@class ABI43_0_0EXGLContext;

@protocol ABI43_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI43_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI43_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI43_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI43_0_0EXGLContext : NSObject

- (nullable instancetype)initWithDelegate:(nullable id<ABI43_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI43_0_0EXModuleRegistry *)moduleRegistry;
- (void)initialize:(nullable void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (nullable EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull ABI43_0_0EXPromiseResolveBlock)resolve reject:(nonnull ABI43_0_0EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI43_0_0EXGLContextDelegate> delegate;

@end
