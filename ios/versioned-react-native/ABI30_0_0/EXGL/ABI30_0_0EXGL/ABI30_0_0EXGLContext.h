// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL-CPP/UEXGL.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>

@class ABI30_0_0EXGLContext;

@protocol ABI30_0_0EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull ABI30_0_0EXGLContext *)context;
- (void)glContextInitialized:(nonnull ABI30_0_0EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull ABI30_0_0EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface ABI30_0_0EXGLContext : NSObject

- (instancetype)initWithDelegate:(id<ABI30_0_0EXGLContextDelegate>)delegate andModuleRegistry:(nonnull ABI30_0_0EXModuleRegistry *)moduleRegistry;
- (void)initialize:(void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(void(^)(void))callback;
- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(ABI30_0_0EXPromiseResolveBlock)resolve reject:(ABI30_0_0EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <ABI30_0_0EXGLContextDelegate> delegate;

@end
