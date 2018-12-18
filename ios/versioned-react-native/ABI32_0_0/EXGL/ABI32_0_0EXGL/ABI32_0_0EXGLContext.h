// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL-CPP/UEXGL.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>

@class ABI32_0_0EXGLContext;

@protocol ABI32_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI32_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI32_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI32_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI32_0_0EXGLContext : NSObject

- (instancetype)initWithDelegate:(id<ABI32_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI32_0_0EXModuleRegistry *)moduleRegistry;
- (void)initialize:(void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(void(^)(void))callback;
- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(ABI32_0_0EXPromiseResolveBlock)resolve reject:(ABI32_0_0EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI32_0_0EXGLContextDelegate> delegate;

@end
